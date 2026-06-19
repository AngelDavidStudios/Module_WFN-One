<script setup lang="ts">
import { computed, type Component, type CSSProperties } from 'vue'

interface Props {
  to: string
  label: string
  isActive: boolean
  icon: Component
  iconActive?: Component
}

const props = defineProps<Props>()

const style = computed<CSSProperties>(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  textDecoration: 'none',
  color: props.isActive ? '#fff' : 'rgba(255,255,255,0.7)',
  backgroundColor: props.isActive ? 'rgba(59, 130, 246, 0.8)' : 'transparent',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
  fontWeight: props.isActive ? 600 : 500,
  fontSize: '0.85rem',
  whiteSpace: 'nowrap',
}))

function onEnter(e: MouseEvent): void {
  if (props.isActive) return
  const t = e.currentTarget as HTMLElement
  t.style.backgroundColor = 'rgba(255,255,255,0.1)'
  t.style.color = '#fff'
}
function onLeave(e: MouseEvent): void {
  if (props.isActive) return
  const t = e.currentTarget as HTMLElement
  t.style.backgroundColor = 'transparent'
  t.style.color = 'rgba(255,255,255,0.7)'
}
</script>

<template>
  <RouterLink :to="to" :style="style" @mouseenter="onEnter" @mouseleave="onLeave">
    <span style="width: 18px; height: 18px; flex-shrink: 0">
      <component
        :is="isActive && iconActive ? iconActive : icon"
        style="width: 18px; height: 18px"
      />
    </span>
    <span>{{ label }}</span>
  </RouterLink>
</template>
