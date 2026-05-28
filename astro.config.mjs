// @ts-check
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL;

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: isVercel ? vercel({ isr: false }) : node({ mode: 'standalone' }),
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
