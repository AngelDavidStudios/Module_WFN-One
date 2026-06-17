<script setup lang="ts">
import { useSessionStore } from '../stores/session'

const session = useSessionStore()

function login(): void {
  session.signIn('/post-login')
}
</script>

<template>
  <main class="home">
    <h1>WFN One — Sistema A</h1>
    <p class="subtitle">Módulo de vacaciones · cliente público del BFF Sistema C.</p>

    <section v-if="!session.isAuthenticated" class="card">
      <p>No has iniciado sesión.</p>
      <button class="primary" @click="login">Iniciar sesión con Cognito</button>
      <p class="hint">
        Te enviaremos al Managed Login de Cognito. Si es tu primer ingreso te
        pedirá configurar TOTP (Authy / Google Authenticator).
      </p>
    </section>

    <section v-else class="card">
      <p>
        Estás logueado como <strong>{{ session.user?.email }}</strong>.
      </p>
      <div class="actions">
        <RouterLink to="/dashboard" class="primary">Ir al dashboard</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: 640px;
  margin: 3rem auto;
  padding: 0 1rem;
}
.subtitle {
  color: var(--color-text);
  margin-bottom: 2rem;
}
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.primary {
  display: inline-block;
  background: var(--color-primary);
  color: #ffffff;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  margin-top: 0.75rem;
  transition: background-color 0.15s;
}
.primary:hover {
  background: var(--color-primary-hover);
  text-decoration: none;
}
.hint {
  color: var(--color-muted);
  font-size: 0.9rem;
  margin-top: 1rem;
}
.actions {
  margin-top: 1rem;
}
</style>
