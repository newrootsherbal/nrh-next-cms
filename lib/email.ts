// lib/email.ts
import nodemailer from 'nodemailer';

export interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(mailOptions: MailOptions) {
    try {
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Your Website'}" <${process.env.SMTP_FROM_EMAIL}>`,
            ...mailOptions,
        });
        console.log('Email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        // Re-throw the error to be caught by the caller
        throw new Error('Failed to send email.');
    }
}