<script setup lang="ts">
interface Props {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number'
  modelValue: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 6px">
    <label
      v-if="label"
      style="font-weight: 600; color: #374151; font-size: 0.9rem"
    >
      {{ label }} <span v-if="required" style="color: #dc2626">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :style="{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        backgroundColor: disabled ? '#f9fafb' : '#fff',
        outline: 'none',
      }"
      @input="onInput"
    />
    <p
      v-if="hint && !error"
      style="margin: 0; font-size: 0.8rem; color: #9ca3af"
    >
      {{ hint }}
    </p>
    <p v-if="error" style="margin: 0; font-size: 0.8rem; color: #dc2626">
      {{ error }}
    </p>
  </div>
</template>
