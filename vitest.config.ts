import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // El paquete real solo tira error a propósito fuera del bundler de
      // Next (que lo intercepta y lo deja vacío en builds de servidor) —
      // acá lo reemplazamos por un no-op para poder testear módulos que lo
      // importan (ej. lib/instagram.ts) sin arrastrar ese error a Vitest.
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
})
