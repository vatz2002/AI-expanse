import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { parseTransactionEmail } from './parsers';
import { categorizeExpense } from './ai-categorization';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/sync/gmail/callback'
);

export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        prompt: 'consent', // Force refresh token generation
    });
};

export const setCredentials = async (code: string, userId: string, userEmail: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in DB
    await prisma.gmailConnection.upsert({
        where: { userId },
        update: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
            email: userEmail,
            lastSyncedAt: new Date(),
        },
        create: {
            userId,
            email: userEmail,
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
            lastSyncedAt: new Date(),
        },
    });

    return tokens;
};

export const getGmailClient = async (userId: string) => {
    const connection = await prisma.gmailConnection.findUnique({
        where: { userId },
    });

    if (!connection) throw new Error('Gmail not connected');

    oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
        expiry_date: connection.expiryDate ? Number(connection.expiryDate) : undefined,
    });

    // Handle token refresh if needed (googleapis handles it automatically if refresh_token is set)

    return google.gmail({ version: 'v1', auth: oauth2Client });
};

export const syncRecentTransactions = async (userId: string) => {
    const gmail = await getGmailClient(userId);

    // List messages from known banks
    // Query: "from:(alerts@hdfcbank.net OR upi@paytm.com) newer_than:7d"
    const query = 'from:(alerts@hdfcbank.net OR alerts@sbi.co.in OR no-reply@paytm.com) newer_than:30d';

    const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 20,
    });

    const messages = res.data.messages || [];
    const transactions = [];

    for (const msg of messages) {
        if (!msg.id) continue;
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full', // need parsing body
        });

        const payload = message.data.payload;
        if (!payload) continue;

        const headers = payload.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';

        // Decode body (base64url)
        let body = '';
        if (payload.body?.data) {
            body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } else if (payload.parts) {
            // simplified: assume first text/plain part
            const part = payload.parts.find(p => p.mimeType === 'text/plain');
            if (part && part.body?.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
        }

        const transaction = parseTransactionEmail(from, subject, body);
        if (transaction) {
            transactions.push(transaction);

            // Save to database as Expense
            // Check for duplicates (by date + amount + merchant?) - for now simple insert
            const description = `Paid to ${transaction.merchant} (${transaction.source})`;
            const aiResult = categorizeExpense(description, transaction.amount);

            await prisma.expense.create({
                data: {
                    userId,
                    amount: transaction.amount,
                    category: aiResult.category,
                    description,
                    date: transaction.date,
                    aiCategorized: true,
                    // receiptText: body, // optional: store raw email body for reference
                },
            });
        }
    }

    // Update last synced
    await prisma.gmailConnection.update({
        where: { userId },
        data: { lastSyncedAt: new Date() },
    });

    return transactions;
};
