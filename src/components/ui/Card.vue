<script setup lang="ts">
import { computed } from 'vue'

export type CardPadding = 'sm' | 'md' | 'lg'

interface Props {
  title?: string
  subtitle?: string
  iconBg?: string
  padding?: CardPadding
}

const props = withDefaults(defineProps<Props>(), {
  iconBg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  padding: 'md',
})

const paddingStyles: Record<CardPadding, string> = {
  sm: '16px',
  md: '24px',
  lg: '32px',
}

const pad = computed(() => paddingStyles[props.padding])
</script>

<template>
  <div
    :style="{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: pad,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    }"
  >
    <div
      v-if="title || $slots.icon"
      style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px"
    >
      <div
        v-if="$slots.icon"
        :style="{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <slot name="icon" />
      </div>
      <div>
        <h3
          v-if="title"
          style="margin: 0; color: #1f2937; font-size: 1.1rem; font-weight: 600"
        >
          {{ title }}
        </h3>
        <p
          v-if="subtitle"
          style="margin: 0; color: #6b7280; font-size: 0.8rem"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>
    <slot />
  </div>
</template>
