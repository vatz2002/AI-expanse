import { Resend } from 'resend';
import { ExpenseNotificationEmail } from '@/emails/ExpenseNotification';

// Initialize Resend with API key if available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendExpenseNotification({
    to,
    groupName,
    expenseAmount,
    expenseDescription,
    paidBy,
    groupId,
    expenseCategory,
    date,
}: {
    to: string | string[];
    groupName: string;
    expenseAmount: string;
    expenseDescription: string;
    paidBy: string;
    groupId: string;
    expenseCategory: string;
    date: string;
}) {
    try {
        if (!resend) {
            console.log('📧 [EMAIL MOCK] Would have sent expense notification to:', to);
            console.log(`Title: ${groupName} - New Expense: ${expenseDescription} for ${expenseAmount}`);
            return { success: true, mocked: true };
        }

        const { data, error } = await resend.emails.send({
            from: 'AI Expanse <notifications@resend.dev>', // Change this to your verified domain when going to production
            to: Array.isArray(to) ? to : [to],
            subject: `New expense added in ${groupName}`,
            react: ExpenseNotificationEmail({
                groupName,
                expenseAmount,
                expenseDescription,
                paidBy,
                groupId,
                expenseCategory,
                date,
            }),
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error };
    }
}
