<script setup lang="ts">
import { useSessionStore } from '../stores/session'

const session = useSessionStore()

function logout(): void {
  session.signOut()
}
</script>

<template>
  <main class="dashboard">
    <header class="head">
      <div>
        <h1>Dashboard</h1>
        <p class="muted">
          {{ session.user?.email }} · roles: {{ session.roles.join(', ') }}
        </p>
      </div>
      <button class="danger" @click="logout">Salir</button>
    </header>

    <section class="card">
      <p>
        Fundación BFF lista. Las vistas de vacaciones, organización, usuarios y
        auditoría se migrarán en la siguiente fase.
      </p>
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.muted {
  color: var(--color-muted);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.danger {
  background: var(--color-danger);
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}
.danger:hover {
  background: var(--color-danger-hover);
}
</style>
