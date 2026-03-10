import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Button,
} from '@react-email/components';
import * as React from 'react';

interface ExpenseNotificationProps {
    groupName: string;
    expenseAmount: string;
    expenseDescription: string;
    paidBy: string;
    groupId: string;
    expenseCategory: string;
    date: string;
}

export const ExpenseNotificationEmail = ({
    groupName,
    expenseAmount,
    expenseDescription,
    paidBy,
    groupId,
    expenseCategory,
    date,
}: ExpenseNotificationProps) => {
    const previewText = `New expense added in ${groupName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>New Expense in {groupName}</Heading>

                    <Text style={text}>
                        Hello there,
                    </Text>
                    <Text style={text}>
                        <strong>{paidBy}</strong> just added a new expense for <strong>{expenseCategory}</strong> in your group.
                    </Text>

                    <Section style={expenseCard}>
                        <Text style={expenseTitle}>{expenseDescription}</Text>
                        <Text style={expenseAmountText}>{expenseAmount}</Text>
                        <Hr style={hrSmall} />
                        <Text style={expenseDate}>{date}</Text>
                    </Section>

                    <Text style={text}>
                        Log into the app to see how this affects your balance or to settle up!
                    </Text>

                    <Section style={buttonContainer}>
                        <Button
                            href={`http://localhost:3000/dashboard/groups/${groupId}`}
                            target="_blank"
                            style={button}
                        >
                            View Group
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    <Text style={footer}>
                        AI Expanse - Indian Expense Tracker
                        <br />
                        You're receiving this because you are a member of {groupName}.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default ExpenseNotificationEmail;

const main = {
    backgroundColor: '#f4f4f5',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '40px auto',
    padding: '40px 30px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    maxWidth: '500px',
};

const h1 = {
    color: '#09090b',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.4',
    margin: '0 0 20px',
};

const text = {
    color: '#52525b',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px',
};

const expenseCard = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const expenseTitle = {
    color: '#334155',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 8px',
};

const expenseAmountText = {
    color: '#0f172a',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 16px',
};

const expenseDate = {
    color: '#64748b',
    fontSize: '13px',
    margin: '0',
};

const hrSmall = {
    borderColor: '#e2e8f0',
    margin: '16px 0',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0 24px',
};

const button = {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const hr = {
    borderColor: '#e4e4e7',
    margin: '32px 0 24px',
};

const footer = {
    color: '#a1a1aa',
    fontSize: '13px',
    lineHeight: '1.5',
    textAlign: 'center' as const,
    margin: '0',
};
