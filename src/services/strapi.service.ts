// src/services/strapi.service.ts
import { logger } from './logger';

interface StrapiUser {
    id: number;
    email: string;
    [key: string]: any;
}

interface StrapiConfig {
    baseUrl: string;
    apiToken: string;
}

export class StrapiService {
    private config: StrapiConfig;

    constructor(config: StrapiConfig) {
        this.config = config;
        this.validateConfig();
    }

    private validateConfig(): void {
        if (!this.config.apiToken) {
            throw new Error('STRAPI_API_TOKEN is not configured');
        }
    }

    async getUserByEmail(email: string): Promise<StrapiUser | null> {
        const encodedEmail = encodeURIComponent(email);
        const url = `${this.config.baseUrl}/users?filters[email][$eq]=${encodedEmail}`;

        logger.info(`[StrapiService] Fetching user by email from: ${this.config.baseUrl}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiToken}`,
                },
            });

            logger.debug(`[StrapiService] User lookup response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[StrapiService] Strapi lookup failed: ${response.status}`, {
                    status: response.status,
                    error: errorText,
                });
                return null;
            }

            const userData = await response.json();
            logger.debug('[StrapiService] User lookup successful', { dataStructure: typeof userData });

            // Handle both Strapi standard API { data: [...] } and users-permissions [...] structures
            const user = Array.isArray(userData) ? userData[0] : userData.data?.[0];

            if (!user) {
                logger.info(`[StrapiService] No user found for email: ${email}`);
                return null;
            }

            logger.info(`[StrapiService] User found: ID ${user.id}`);
            return user;
        } catch (error) {
            logger.error('[StrapiService] Exception during user lookup:', error);
            return null;
        }
    }

    async updateUserResetToken(userId: number, resetToken: string, expiryDate: Date): Promise<boolean> {
        const url = `${this.config.baseUrl}/users/${userId}`;

        logger.info(`[StrapiService] Updating user ${userId} with reset token`);

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiToken}`,
                },
                body: JSON.stringify({
                    resetToken,
                    resetTokenExpiry: expiryDate.toISOString(),
                }),
            });

            logger.debug(`[StrapiService] User update response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[StrapiService] User update failed: ${response.status}`, {
                    status: response.status,
                    error: errorText,
                });
                return false;
            }

            logger.info(`[StrapiService] User ${userId} updated successfully`);
            return true;
        } catch (error) {
            logger.error(`[StrapiService] Exception during user update:`, error);
            return false;
        }
    }
}