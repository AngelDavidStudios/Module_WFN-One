<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const session = useSessionStore()

onMounted(async () => {
  // Sistema C ya creó la sesión y nos redirigió aquí.
  // Re-hidratamos el store y navegamos al dashboard.
  await session.load()
  if (session.isAuthenticated) {
    router.replace({ name: 'dashboard' })
  } else {
    router.replace({ name: 'home' })
  }
})
</script>

<template>
  <main class="post-login">
    <p>Procesando inicio de sesión…</p>
  </main>
</template>

<style scoped>
.post-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  color: var(--color-muted);
}
</style>
