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
    // metà. Deve coprire il worst-case dei retry di fetchStrapiWithRetry (~25s).
    // Nota: il tetto reale dipende dal piano Vercel (Hobby limita a 60s).
    adapter: isVercel ? vercel({ isr: false, maxDuration: 30 }) : node({ mode: 'standalone' }),
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
