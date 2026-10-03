/// <reference types="vitest" />
// `defineConfig` viene de vitest/config y no de vite: es el que acepta la
// clave `test`. Con el de vite, tsc rechaza la configuracion.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Los tests viven junto al codigo que proban, en src/**/__tests__.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})