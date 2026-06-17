<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useSessionStore } from './stores/session'

const session = useSessionStore()

onMounted(() => {
  if (!session.loaded) session.load()
})

window.addEventListener('auth:unauthorized', () => {
  session.$patch({ user: null })
})
</script>

<template>
  <RouterView />
</template>
