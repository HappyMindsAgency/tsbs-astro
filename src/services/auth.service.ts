import { LoginError, AuthServiceError } from './auth-utils'; // Assicurati che LoginError sia esportato da auth-utils

/**
 * Autentica un utente tramite l'API Strapi.
 * @param identifier L'email o username dell'utente.
 * @param password La password dell'utente.
 * @param strapiBaseUrl L'URL base dell'API Strapi.
 * @returns Un oggetto contenente il token JWT e i dati dell'utente in caso di successo.
 * @throws AuthServiceError in caso di fallimento autenticazione.
 */
export async function authenticateUser(identifier: string, password: string, strapiBaseUrl: string): Promise<{ jwt: string; user: any }> {
    const strapiAuthUrl = `${strapiBaseUrl}/auth/local`;
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
