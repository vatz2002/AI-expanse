export interface ExtractedTransaction {
    amount: number;
    merchant: string;
    date: Date;
    source: string; // e.g., "HDFC", "Paytm"
    type: 'debit' | 'credit';
}

const parseAmount = (text: string): number | null => {
    const match = text.replace(/,/g, '').match(/Rs\.?\s*(\d+(\.\d{1,2})?)|INR\s*(\d+(\.\d{1,2})?)/i);
    if (match) {
        return parseFloat(match[1] || match[3]);
    }
    return null;
};

// --- Parsers for specific banks/apps ---

const parseHDFC = (body: string): ExtractedTransaction | null => {
    // Example: "Rs. 500.00 was spent on your Credit Card XX1234 on 2024-02-17 at SWIGGY"
    // Example: "Rs. 1200.00 debited from a/c **1234 to UPI-PAYTM on 17-02-24"
    if (!body.includes('spent') && !body.includes('debited')) return null;

    const amount = parseAmount(body);
    if (!amount) return null;

    let merchant = 'Unknown';
    const merchantMatch = body.match(/(?:at|to)\s+([^0-9]+?)(?:\s+on|\.$)/i);
    if (merchantMatch) merchant = merchantMatch[1].trim();

    return {
        amount,
        merchant,
        date: new Date(), // Date parsing logic to be refined based on actual email format
        source: 'HDFC Bank',
        type: 'debit',
    };
};

const parseSBI = (body: string): ExtractedTransaction | null => {
    // Example: "Your a/c no. XXXXX1234 is debited for Rs.230.00 on 17Feb24 ... to VPA urbancompany@okaxis"
    if (!body.toLowerCase().includes('debited')) return null;

    const amount = parseAmount(body);
    if (!amount) return null;

    let merchant = 'Unknown';
    const merchantMatch = body.match(/to VPA\s+([^\s]+)/i);
    if (merchantMatch) merchant = merchantMatch[1].trim();

    return {
        amount,
        merchant,
        date: new Date(),
        source: 'SBI',
        type: 'debit',
    };
};

const parsePaytm = (body: string): ExtractedTransaction | null => {
    // Example: "Paid Rs. 50 to Uber"
    if (!body.toLowerCase().startsWith('paid')) return null;

    const amount = parseAmount(body);
    if (!amount) return null;

    let merchant = 'Unknown';
    const merchantMatch = body.match(/to\s+(.+?)(?:\s+using|$)/i);
    if (merchantMatch) merchant = merchantMatch[1].trim();

    return {
        amount,
        merchant,
        date: new Date(),
        source: 'Paytm',
        type: 'debit',
    };
};

export const parseTransactionEmail = (sender: string, subject: string, body: string): ExtractedTransaction | null => {
    const normalizedBody = body.replace(/\s+/g, ' ').trim();

    if (sender.includes('hdfcbank')) return parseHDFC(normalizedBody);
    if (sender.includes('sbi')) return parseSBI(normalizedBody);
    if (sender.includes('paytm')) return parsePaytm(normalizedBody);

    // Fallback or generic parsing can be added here
    return null;
};
