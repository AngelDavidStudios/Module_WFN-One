<script setup lang="ts">
// Modal simple (equivalente al Modal local de UserManagement en React):
// overlay con cierre al hacer clic fuera, tarjeta con título y slot.
interface Props {
  title: string
}
defineProps<Props>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    style="
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    "
    @click="emit('close')"
  >
    <div
      style="
        background-color: #fff;
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      "
      @click.stop
    >
      <h2
        style="
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        "
      >
        {{ title }}
      </h2>
      <slot />
    </div>
  </div>
</template>
