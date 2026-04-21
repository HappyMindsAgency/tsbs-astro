// Funzione per tradurre etichette con fallback di sicurezza
export default function customLabel(label, locale = 'it') {
    const data = {  
        'Torna alla homepage': {
            'it': 'Torna alla homepage',
            'en': 'Return to homepage'
        },
        'Newsletter': {
            'it': 'Newsletter',
            'en': 'Newsletter'
        },
    };

    // Controlla che l'etichetta esista nel dizionario
    if (!data[label]) {
        console.warn(`Etichetta non trovata: '${label}'`);
        return label; // fallback: restituisci l'etichetta originale
    }

    // Controlla che la lingua sia definita per quell'etichetta
    if (!data[label][locale]) {
        console.warn(`Traduzione non trovata per '${label}' in '${locale}'`);
        return data[label]['it']; // fallback: italiano
    }

    // Ritorna la traduzione corretta
    return data[label][locale];
}
