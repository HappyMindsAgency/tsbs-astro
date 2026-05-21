import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // Recuperiamo l'URL di base (es. http://localhost:4321) per gestire i redirect futuri
	const baseUrl = new URL(request.url).origin;

	console.log('\n====== [ASTRO API] INIZIO TENTATIVO DI LOGIN ======');
	console.log(`Base url: ${baseUrl}`);

	try {
    // 1. ESTRAZIONE DATI
    const formData = await request.formData();
    const identifier = formData.get('identifier')?.toString()?.trim();
    const password = formData.get('password')?.toString();

    console.log('1. Dati estratti dal Form HTML:');
    console.log(`   - Identifier (email/username): [${identifier}]`);
    console.log(`   - Password inserita (lunghezza): ${password ? password.length : 0} caratteri`);

    // Validazione di sicurezza minimale
    if (!identifier || !password) {
		console.warn('Validazione fallita: Campi incompleti.');
		return Response.redirect(`${baseUrl}/?error=Campi_obbligatori`, 303);
    }

    // 2. PREPARAZIONE E INVIO RICHIESTA A STRAPI
    const strapiUrl = 'http://localhost:1337/api/auth/local';
    const requestBody = { identifier, password };

    console.log(`2. Invio richiesta POST a Strapi -> ${strapiUrl}`);
    console.log('   Payload inviato (in chiaro per controllo Strapi):', JSON.stringify(requestBody));

    const strapiResponse = await fetch(strapiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
    });

    console.log(`3. Risposta ricevuta da Strapi. Status: ${strapiResponse.status} ${strapiResponse.statusText}`);

    const data = await strapiResponse.json();

    // 4. GESTIONE ERRORI STRAPI (Status diverso da 2xx)
    if (!strapiResponse.ok) {
		console.error('Strapi ha rifiutato le credenziali!');
		console.error('   Dettaglio Errore Strapi:', JSON.stringify(data.error));

		const errorMessage = data.error?.message || 'Credenziali_non_valide';
      // Ridirigiamo l'utente alla pagina del form passando l'errore nell'URL
		return Response.redirect(`${baseUrl}/?error=${encodeURIComponent(errorMessage)}`, 303);
    }

    // 5. LOGIN CON SUCCESSO
    console.log('Strapi ha autenticato l utente con successo!');
    console.log(`   - JWT ottenuto: ${data.jwt ? data.jwt.substring(0, 15) + '...' : 'NON PRESENTE'}`);
    console.log(`   - ID Utente Strapi: ${data.user?.id}`);
    console.log(`   - Email Utente Strapi: ${data.user?.email}`);
    console.log('===================================================\n');

    return Response.redirect(`${baseUrl}/atrio`, 303);

	} catch (error) {
		// Gestione di crash di rete o del server Strapi spento
		console.error('ERRORE CRITICO nel server Astro:', error);
		return Response.redirect(`${baseUrl}/?error=Errore_interno_server`, 303);
	}
};