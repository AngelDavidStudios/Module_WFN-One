import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Todas las peticiones /api/* se reenvían a Sistema C (NestJS BFF).
      // Así Vue y Nest comparten origen desde la perspectiva del navegador,
      // y la cookie de iron-session (SameSite=Lax en dev) fluye sin necesidad
      // de SameSite=None;Secure en localhost.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
