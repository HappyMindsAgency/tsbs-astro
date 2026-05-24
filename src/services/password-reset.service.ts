// src/services/password-reset.service.ts
import crypto from 'crypto';
import { EmailService } from './email.service';
import { StrapiService } from './strapi.service';
import { logger } from './logger';

interface PasswordResetConfig {
    tokenExpiryMinutes: number;
    resetLinkBase: string;
}

interface PasswordResetResult {
    success: boolean;
    message: string;
    userId?: number;
}

export class PasswordResetService {
    private emailService: EmailService;
    private strapiService: StrapiService;
    private config: PasswordResetConfig;

    constructor(
        emailService: EmailService,
        strapiService: StrapiService,
        config: PasswordResetConfig
    ) {
        this.emailService = emailService;
        this.strapiService = strapiService;
        this.config = config;
    }

    async requestPasswordReset(email: string): Promise<PasswordResetResult> {
        logger.info(`[PasswordResetService] Password reset requested for: ${email}`);

        // Validate email format
        if (!this.isValidEmail(email)) {
            logger.warn(`[PasswordResetService] Invalid email format: ${email}`);
            // Return generic message to avoid email enumeration
            return this.getGenericSuccessResponse();
        }

        // 1. Find user in Strapi
        const user = await this.strapiService.getUserByEmail(email);
        if (!user) {
            logger.info(`[PasswordResetService] User not found for email: ${email}`);
            // Return generic message to avoid email enumeration
            return this.getGenericSuccessResponse();
        }

        // 2. Generate secure token
        const token = this.generateToken();
        const expiryDate = this.calculateExpiry();
        logger.info(`[PasswordResetService] Token generated for user ${user.id}`);

        // 3. Update user in Strapi with token
        const updateSuccess = await this.strapiService.updateUserResetToken(
            user.id,
            token,
            expiryDate
        );

        if (!updateSuccess) {
            logger.error(`[PasswordResetService] Failed to update user ${user.id} with reset token`);
            // Return generic message even on failure
            return this.getGenericSuccessResponse();
        }

        // 4. Send password reset email
        const resetLink = `${this.config.resetLinkBase}?token=${token}`;
        await this.emailService.sendPasswordResetEmail({
            email,
            resetLink,
            tokenExpiryMinutes: this.config.tokenExpiryMinutes,
        });

        logger.info(`[PasswordResetService] Password reset process completed for user ${user.id}`);
        return this.getGenericSuccessResponse();
    }

    private generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private calculateExpiry(): Date {
        return new Date(Date.now() + this.config.tokenExpiryMinutes * 60 * 1000);
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private getGenericSuccessResponse(): PasswordResetResult {
        return {
            success: true,
            message: 'If an account with that email exists, you will receive an email with further instructions.',
        };
    }
}