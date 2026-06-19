<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  loading: false,
  disabled: false,
  type: 'button',
})

const emit = defineEmits<{ click: [] }>()

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: { backgroundColor: '#3b82f6', color: '#fff' },
  secondary: { backgroundColor: '#f3f4f6', color: '#374151' },
  danger: { backgroundColor: '#ef4444', color: '#fff' },
  success: { backgroundColor: '#10b981', color: '#fff' },
  ghost: { backgroundColor: 'transparent', color: '#6b7280' },
}

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '0.8rem' },
  md: { padding: '10px 18px', fontSize: '0.9rem' },
  lg: { padding: '14px 24px', fontSize: '1rem' },
}

const isDisabled = computed(() => props.disabled || props.loading)

const style = computed<CSSProperties>(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 600,
  cursor: isDisabled.value ? 'not-allowed' : 'pointer',
  opacity: isDisabled.value ? 0.6 : 1,
  transition: 'all 0.2s ease',
  width: props.fullWidth ? '100%' : 'auto',
  ...variantStyles[props.variant],
  ...sizeStyles[props.size],
}))

function onClick(): void {
  if (!isDisabled.value) emit('click')
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :title="title"
    :style="style"
    @click="onClick"
  >
    <span v-if="loading" class="btn-spin" />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>

<style scoped>
.btn-spin {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}
</style>
