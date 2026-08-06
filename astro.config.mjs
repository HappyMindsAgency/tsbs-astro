// @ts-check
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL;

// https://astro.build/config
export default defineConfig({
    output: 'server',
    // maxDuration: alza il timeout delle function serverless su Vercel così una
    // scrittura verso Strapi (Render) durante il cold-start non viene uccisa a
    // metà. Deve coprire il worst-case dei retry di fetchStrapiWithRetry
    // (src/lib/strapi/client.ts, ~23s: 3 tentativi x 7s + backoff 500ms/1500ms).
    // Nota: il tetto reale dipende dal piano Vercel (Hobby limita a 60s).
    // ponytail: fetchStrapiWithRetry copre solo le letture che passano da
    // fetchStrapi (client.ts) — grimorio/eventi/missioni/trofei/mappa/epistole/
    // policy/faq. I moduli con scritture dirette (tessera.ts, referral.ts,
    // progressione.ts, ecc.) usano ancora fetch() singolo senza retry: estendere
    // quando anche quelle scritture avranno bisogno di resilienza sui 5xx.
    adapter: isVercel ? vercel({ isr: false, maxDuration: 30 }) : node({ mode: 'standalone' }),
    // ponytail: nessuna ragione documentata trovata per checkOrigin:false (nessun commento,
    // nessuna chiamata cross-origin legittima in src/** verso le API in src/pages/api/**).
    // Rimosso l'override: Astro usa il default (checkOrigin:true), che blocca POST/PUT/PATCH/DELETE
    // con Origin header non corrispondente, mitigando CSRF su change-password, update-username,
    // delete-account, accademia, tessera, ecc. Se in futuro serve consentire un client cross-origin
    // legittimo (es. webview mobile), reintrodurre security.checkOrigin solo dopo aver aggiunto
    // una verifica manuale di Origin/Referer nelle singole route sensibili.
    server: {
        host: true,
        port: 4321,
    },
    vite: {
        css: {
        preprocessorOptions: {
            scss: {
            quietDeps: true,
            silenceDeprecations: ["import"],
            },
        },
        },
    },
});
