// src/services/auth.service.ts

import { LoginError, AuthServiceError, RegistrationError, RegistrationServiceError } from '../utils/auth.utils';
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
            console.error('[AuthService] STRAPI_API is not set. Authentication will fail.');
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

    async getUserByEmail(email: string): Promise<StrapiUser | null> {
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

    /**
     * Registra un nuovo utente tramite l'API Strapi (/auth/local/register).
     * In caso di successo restituisce JWT e dati utente.
     *
     * @param username Il nome utente scelto.
     * @param email L'email dell'utente.
     * @param password La password scelta.
     * @returns Un oggetto contenente il token JWT e i dati dell'utente.
     * @throws RegistrationServiceError in caso di fallimento.
     *
     * TODO: Aggiungere campi extra (name, surname, city, marketing) una volta
     * confermati i campi obbligatori e il modello User su Strapi.
     */
    async registerUser(username: string, email: string, password: string): Promise<{ jwt: string; user: any }> {
        logger.info('[AuthService] Registering new user...');
        const strapiRegisterUrl = `${this.strapiApiBaseUrl}/auth/local/register`;

        try {
            const response = await fetch(strapiRegisterUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message: string = data?.error?.message || '';
                logger.warn(`[AuthService] Strapi registration failed: ${message}`);

                // Strapi restituisce "Email or Username are already taken" per duplicati.
                if (message.toLowerCase().includes('already taken')) {
                    throw new RegistrationServiceError(RegistrationError.ALREADY_TAKEN);
                }

                throw new RegistrationServiceError(RegistrationError.INTERNAL_SERVER_ERROR);
            }

            const { jwt, user } = data;

            if (!jwt || !user) {
                logger.error('[AuthService] Strapi registration OK but JWT or User missing.');
                throw new RegistrationServiceError(RegistrationError.INTERNAL_SERVER_ERROR);
            }

            logger.info('[AuthService] User registered successfully.');
            return { jwt, user };
        } catch (error) {
            if (error instanceof RegistrationServiceError) throw error;
            logger.error('[AuthService] Unexpected error during registration:', error);
            throw new RegistrationServiceError(RegistrationError.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Crea il record Membro su Strapi e lo collega all'utente appena registrato.
     * Usa il token admin (STRAPI_API) perché l'utente non è ancora autenticato nel sistema.
     *
     * @param userId L'ID dello User Strapi appena creato.
     * @param nickname Il nickname scelto (corrisponde a User.username).
     * @param email L'email dell'utente.
     * @param nome Il nome (opzionale).
     * @param cognome Il cognome (opzionale).
     * @returns true se la creazione ha avuto successo, false altrimenti.
     *
     * TODO: Aggiungere externalAuthId una volta chiarito:
     *   - cos'è (codice generato? assegnato? da quale sistema?)
     *   - se viene creato qui, durante l'onboarding o manualmente
     *   - formato esatto (6 caratteri: numerico? alfanumerico?)
     */
    async createMembro(
        userId: number,
        nickname: string,
        email: string,
        nome: string,
        cognome: string,
    ): Promise<boolean> {
        logger.info(`[AuthService] Creating Membro for user ${userId}...`);
        const url = `${this.strapiApiBaseUrl}/membri`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.strapiApiToken}`,
                },
                body: JSON.stringify({
                    data: {
                        nickname,
                        email,
                        nome: nome || null,
                        cognome: cognome || null,
                        attivo: true,
                        user: userId,
                        livello: { connect: [{ id: 1 }] },
                        datiAggiuntivi: {
                            iscrittoDal: new Date().toISOString().split('T')[0],
                        },
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[AuthService] Membro creation failed: ${response.status}`, { errorText });
                return false;
            }

            logger.info(`[AuthService] Membro created for user ${userId}.`);
            return true;
        } catch (error) {
            logger.error('[AuthService] Unexpected error during Membro creation:', error);
            return false;
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