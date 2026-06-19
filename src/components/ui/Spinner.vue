<script setup lang="ts">
import { computed } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

export type SpinnerSize = 'sm' | 'md' | 'lg'

interface Props {
  size?: SpinnerSize
  color?: string
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: '#3b82f6',
})

const sizeMap: Record<SpinnerSize, number> = { sm: 20, md: 32, lg: 48 }
const px = computed(() => `${sizeMap[props.size]}px`)
</script>

<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    "
  >
    <ArrowPathIcon
      :style="{
        width: px,
        height: px,
        color: color,
        animation: 'spin 1s linear infinite',
      }"
    />
    <span v-if="text" style="color: #6b7280; font-size: 0.9rem">{{ text }}</span>
  </div>
</template>
