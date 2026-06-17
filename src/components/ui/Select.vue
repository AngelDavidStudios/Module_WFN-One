<script setup lang="ts">
export interface SelectOption {
  value: string
  label: string
}

interface Props {
  label?: string
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hint?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
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
    <select
      :value="modelValue"
      :disabled="disabled"
      :style="{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        fontSize: '0.95rem',
        backgroundColor: disabled ? '#f9fafb' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }"
      @change="onChange"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="hint" style="margin: 0; font-size: 0.8rem; color: #9ca3af">
      {{ hint }}
    </p>
  </div>
</template>
