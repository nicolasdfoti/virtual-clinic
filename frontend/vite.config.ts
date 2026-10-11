/// <reference types="vitest" />
// `defineConfig` viene de vitest/config y no de vite: es el que acepta la
// clave `test`. Con el de vite, tsc rechaza la configuracion.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Los tests viven junto al codigo que proban, en src/**/__tests__.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // En la corrida completa (varios archivos en paralelo bajo jsdom) algunos
    // tests con muchas queries quedan al borde del default de 5s. Un limite mas
    // holgado evita falsos negativos sin esconder cuelgues reales.
    testTimeout: 15000,
    hookTimeout: 15000,
  },
})