<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  isOpen: boolean
  title: string
  subtitle?: string
  iconBg?: string
  maxWidth?: string
}

withDefaults(defineProps<Props>(), {
  iconBg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  maxWidth: '480px',
})

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    v-if="isOpen"
    style="
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    "
    @click="emit('close')"
  >
    <div
      :style="{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: maxWidth,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }"
      @click.stop
    >
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        "
      >
        <div style="display: flex; align-items: center; gap: 12px">
          <div
            v-if="$slots.icon"
            :style="{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
          >
            <slot name="icon" />
          </div>
          <div>
            <h2
              style="
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
              "
            >
              {{ title }}
            </h2>
            <p
              v-if="subtitle"
              style="margin: 0; font-size: 0.85rem; color: #6b7280"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
        <button
          style="
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: none;
            background-color: #f3f4f6;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          "
          @click="emit('close')"
        >
          <XMarkIcon style="width: 20px; height: 20px" />
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
