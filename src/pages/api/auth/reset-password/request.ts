// src/pages/api/auth/reset-password/request.ts
import type { APIRoute } from 'astro';
import { EmailService } from '../../../../services/email.service';
import { PasswordResetService } from '../../../../services/password-reset.service';
import { logger } from '../../../../services/logger';
import { AuthService } from '../../../../services/auth.service';
import { getStrapiApiUrl } from '../../../../lib/strapi/api-url';

// Configuration
const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;
const SMTP_HOST = import.meta.env.SMTP_HOST;
const SMTP_PORT = parseInt(import.meta.env.SMTP_PORT || '587');
const SMTP_USERNAME = import.meta.env.SMTP_USERNAME;
const SMTP_PASSWORD = import.meta.env.SMTP_PASSWORD;
const DEFAULT_FROM_EMAIL = import.meta.env.DEFAULT_FROM_EMAIL;
const TOKEN_EXPIRY_MINUTES = 15;

// Initialize services once (consider using a singleton pattern)
let passwordResetService: PasswordResetService | null = null;

function initializeServices(): PasswordResetService {
    if (passwordResetService) {
        return passwordResetService;
    }

    try {
        const emailService = new EmailService({
            host: SMTP_HOST,
            port: SMTP_PORT,
            user: SMTP_USERNAME,
            pass: SMTP_PASSWORD,
            fromEmail: DEFAULT_FROM_EMAIL,
        });

        const authService = new AuthService(STRAPI_API_BASE_URL, STRAPI_API);

        passwordResetService = new PasswordResetService(
            emailService,
            authService,
            {
                tokenExpiryMinutes: TOKEN_EXPIRY_MINUTES,
                resetLinkBase: `${STRAPI_API_BASE_URL}/auth/reset-password`,
            }
        );

        // Initialize email service asynchronously in background
        emailService.initialize().catch((error) => {
            logger.error('Failed to initialize email service:', error);
        });

        return passwordResetService;
    } catch (error) {
        logger.error('Failed to initialize password reset service:', error);
        throw new Error('Service initialization failed');
    }
}

interface RequestBody {
    email?: string;
}

export const POST: APIRoute = async ({ request }) => {
    logger.info('[PasswordResetAPI] POST request received');

    try {
        let requestBody: RequestBody;
        try {
            requestBody = await request.json();
        } catch (error) {
            logger.warn('[PasswordResetAPI] Invalid JSON in request body');
            return createErrorResponse('Invalid request body.', 400);
        }

        const email = typeof requestBody.email === 'string' ? requestBody.email.trim() : '';
        if (!email) {
            logger.warn('[PasswordResetAPI] Email parameter missing or invalid');
            return createErrorResponse('Email is required and must be a string.', 400);
        }

        const service = initializeServices();

        const result = await service.requestPasswordReset(email);

        // Return response (always generic for security)
        return createSuccessResponse(result.message);
    } catch (error) {
        logger.error('[PasswordResetAPI] Unexpected error:', error);
        return createErrorResponse('An unexpected error occurred. Please try again later.', 500);
    }
};

function createSuccessResponse(message: string): Response {
    return new Response(JSON.stringify({ message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

function createErrorResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({ message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}