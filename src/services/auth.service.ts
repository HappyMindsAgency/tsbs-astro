// src/services/auth.service.ts

import { LoginError, AuthServiceError } from '../utils/auth.utils';
import { logger } from './logger';

interface StrapiUser {
    id: number;
    email: string;
    username?: string;
    resetToken?: string | null;
    resetTokenExpiry?: string | null;
}

export class AuthService {
    private strapiApiBaseUrl: string;
    private strapiApiToken: string;

    constructor(strapiApiBaseUrl: string, strapiApiToken: string) {
        console.log('[AuthService] Initializing...');
        this.strapiApiBaseUrl = strapiApiBaseUrl;
        this.strapiApiToken = strapiApiToken;
        if (!this.strapiApiToken) {
            console.error('[AuthService] STRAPI_API_TOKEN is not set. Authentication will fail.');
            throw new Error('Server configuration error: Strapi API token missing.');
        }
        console.log('[AuthService] Initialized.');
    }

    /**
     * Autentica un utente tramite l'API Strapi locale (/auth/local).
     * @param identifier L'email o username dell'utente.
     * @param password La password dell'utente.
     * @returns Un oggetto contenente il token JWT e i dati dell'utente in caso di successo.
     * @throws AuthServiceError in caso di fallimento autenticazione.
     */
    async authenticateUser(identifier: string, password: string): Promise<{ jwt: string; user: any }> {
        console.log('[AuthService] Authenticating user...');
        const strapiAuthUrl = `${this.strapiApiBaseUrl}/auth/local`;
        const requestBody = { identifier, password };

        try {
            const response = await fetch(strapiAuthUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                // TODO implementare ispezione più dettagliata di data per identificare errori specifici di autenticazione (es. utente non trovato vs password errata)
                console.error('Strapi authentication failed:', data); // Logga la risposta di errore di Strapi
                throw new AuthServiceError(LoginError.INVALID_CREDENTIALS);
            }

            const jwt = data.jwt;
            const user = data.user;

            if (jwt && user) {
                console.log('[AuthService] User authenticated successfully.');
                return { jwt, user };
            } else {
                // Se la risposta è OK, ma JWT o dati utente mancano
                console.error('Strapi response was OK, but JWT or User data is missing.');
                throw new AuthServiceError(LoginError.SESSION_CONFIG_ERROR);
            }
        } catch (error: any) {
            // Gestisce errori di rete o JSON parsing, oltre agli errori già lanciati.
            if (error instanceof AuthServiceError) {
                // Rilancia gli errori specifici di autenticazione
                throw error;
            }
            // Altrimenti, considera come un errore interno del server
            console.error('Unexpected error during Strapi authentication:', error);
            throw new AuthServiceError(LoginError.INTERNAL_SERVER_ERROR);
        }
    }

    async findUserByEmail(email: string): Promise<StrapiUser | null> {
        console.log(`[AuthService] Looking up user by email: ${email}`);
        const lookupUrl = `${this.strapiApiBaseUrl}/users?filters[email][$eq]=${encodeURIComponent(email)}`;
        
        try {
            const userResponse = await fetch(lookupUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.strapiApiToken}`
                },
            });

            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.error(`[AuthService] Strapi user lookup failed: ${userResponse.status} ${errorText}`);
                // Depending on requirements, could throw an error here.
                // For password reset, we want to be discreet about existence, so we might not throw.
                return null;
            }

            const userData = await userResponse.json();
            // Handle both Strapi standard API structure { data: [...] } and users-permissions structure [...] which might be a direct array.
            const user = Array.isArray(userData) ? userData[0] : userData.data?.[0];

            if (user) {
                console.log(`[AuthService] User found: ID ${user.id}, Email: ${user.email}`);
                return user as StrapiUser;
            } else {
                console.log(`[AuthService] User not found for email: ${email}`);
                return null;
            }
        } catch (error: any) {
            console.error(`[AuthService] Error during Strapi user lookup for email ${email}:`, error);
            throw new Error('Failed to look up user.');
        }
    }

    async updateUserResetToken(userId: number, token: string, expiryDate: Date): Promise<boolean> {
        console.log(`[AuthService] Updating user ${userId} in Strapi with reset token and expiry.`);
        const url = `${this.strapiApiBaseUrl}/users/${userId}`;
        logger.info(`[StrapiService] Updating user ${userId} with reset token`);

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.strapiApiToken}`
                },
                body: JSON.stringify({
                    resetToken: token,
                    resetTokenExpiry: expiryDate.toISOString(), // Store as ISO string
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