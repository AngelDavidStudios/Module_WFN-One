import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { useSessionStore } from './stores/session'

async function bootstrap(): Promise<void> {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // Hidratar la sesión ANTES de montar para que los navigation guards
  // conozcan el estado real desde el primer render.
  const session = useSessionStore()
  await session.load()

  app.use(router)
  app.mount('#app')
}

void bootstrap()
