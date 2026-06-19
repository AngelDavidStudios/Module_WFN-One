<script setup lang="ts">
import { computed } from 'vue'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
export type BadgeSize = 'sm' | 'md'

interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
})

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: '#f3f4f6', color: '#374151' },
  primary: { bg: '#dbeafe', color: '#1d4ed8' },
  success: { bg: '#dcfce7', color: '#166534' },
  warning: { bg: '#fef3c7', color: '#b45309' },
  danger: { bg: '#fee2e2', color: '#dc2626' },
  info: { bg: '#e0e7ff', color: '#4338ca' },
}

const style = computed(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: props.size === 'sm' ? '2px 8px' : '4px 12px',
  backgroundColor: variantStyles[props.variant].bg,
  color: variantStyles[props.variant].color,
  borderRadius: '20px',
  fontSize: props.size === 'sm' ? '0.75rem' : '0.85rem',
  fontWeight: 600,
}))
</script>

<template>
  <span :style="style"><slot /></span>
</template>
