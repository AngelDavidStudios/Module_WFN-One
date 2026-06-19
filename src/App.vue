<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useSessionStore } from './stores/session'
import Navigation from './components/nav/Navigation.vue'

const session = useSessionStore()
const route = useRoute()

// La barra de navegación solo aparece cuando hay sesión y la ruta no es pública
// (login / post-login).
const showNav = computed(
  () => session.isAuthenticated && route.meta.public !== true,
)

onMounted(() => {
  if (!session.loaded) session.load()
})

window.addEventListener('auth:unauthorized', () => {
  session.$patch({ user: null })
})
</script>

<template>
  <div
    style="min-height: 100vh; background-color: #f5f6fa; color: #212529"
  >
    <Navigation v-if="showNav" />
    <RouterView />
  </div>
</template>
