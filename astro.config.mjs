// @ts-check
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: vercel({}),
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
