// Dichiarazione minima per nodemailer v7 (nessun pacchetto @types disponibile)
declare module 'nodemailer' {
    export interface SendMailOptions {
        from?: string;
        to?: string | string[];
        cc?: string | string[];
        bcc?: string | string[];
        subject?: string;
        text?: string;
        html?: string;
        [key: string]: unknown;
    }

    export interface SentMessageInfo {
        messageId: string;
        envelope: { from: string; to: string[] };
        accepted: string[];
        rejected: string[];
        response: string;
    }

    export interface Transporter {
        sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
        verify(): Promise<true>;
        verify(callback: (err: Error | null, success: boolean) => void): void;
    }

    export interface TransportOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        auth?: { user: string; pass: string };
        tls?: { rejectUnauthorized?: boolean };
        [key: string]: unknown;
    }

    export function createTransport(options: TransportOptions): Transporter;
    const nodemailer: { createTransport: typeof createTransport };
    export default nodemailer;
}
