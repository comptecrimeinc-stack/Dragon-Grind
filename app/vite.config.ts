import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// `base: './'` rend tous les chemins relatifs : le build fonctionne aussi bien
// à la racine d'un domaine que dans un sous-dossier GitHub Pages (/<dépôt>/).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [svelte()],
  build: { outDir: 'dist', assetsInlineLimit: 0 },
  // Les tests de composants montent Svelte côté navigateur (jsdom), pas côté serveur.
  resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts']
  }
}));
