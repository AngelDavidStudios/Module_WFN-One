<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div
    style="
      text-align: center;
      padding: 48px 24px;
      background-color: #f9fafb;
      border-radius: 12px;
      border: 2px dashed #e5e7eb;
    "
  >
    <div style="margin-bottom: 12px; color: #9ca3af">
      <slot name="icon" />
    </div>
    <p
      style="
        color: #6b7280;
        margin: 0;
        font-size: 0.95rem;
        font-weight: 500;
      "
    >
      {{ title }}
    </p>
    <p
      v-if="description"
      style="color: #9ca3af; margin: 4px 0 0 0; font-size: 0.85rem"
    >
      {{ description }}
    </p>
    <div v-if="$slots.action" style="margin-top: 16px">
      <slot name="action" />
    </div>
  </div>
</template>
