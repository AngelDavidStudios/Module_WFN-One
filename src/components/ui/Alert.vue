<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface Props {
  type: AlertType
  message: string
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), { dismissible: false })
const emit = defineEmits<{ close: [] }>()

const styles: Record<
  AlertType,
  { bg: string; border: string; color: string; icon: typeof CheckCircleIcon }
> = {
  success: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#065f46',
    icon: CheckCircleIcon,
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    color: '#991b1b',
    icon: XCircleIcon,
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#92400e',
    icon: ExclamationTriangleIcon,
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1e40af',
    icon: InformationCircleIcon,
  },
}

const current = computed(() => styles[props.type])
</script>

<template>
  <div
    :style="{
      padding: '14px 18px',
      borderRadius: '10px',
      backgroundColor: current.bg,
      border: `1px solid ${current.border}`,
      color: current.color,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }"
  >
    <component :is="current.icon" style="width: 20px; height: 20px" />
    <span style="flex: 1">{{ message }}</span>
    <button
      v-if="dismissible"
      style="
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
      "
      @click="emit('close')"
    >
      ✕
    </button>
  </div>
</template>
