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
    // checkOrigin:false — il default true (Astro) confronta l'header Origin del
    // browser con l'url.origin ricostruito da x-forwarded-host/proto: dietro il
    // proxy/edge di Vercel questi due non sempre combaciano (visto in prod: 403
    // "Cross-site POST form submissions are forbidden" su /api/auth/login, mai
    // in locale dove non c'è proxy in mezzo). Nessuna verifica CSRF alternativa
    // in atto sulle route POST sensibili (change-password, delete-account, ecc.).
    security: {
        checkOrigin: false,
    },
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
