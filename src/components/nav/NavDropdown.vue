<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  type Component,
  type CSSProperties,
} from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

export interface DropdownItem {
  to: string
  label: string
  icon: Component
}

interface Props {
  label: string
  items: DropdownItem[]
  isActiveGroup: boolean
  icon: Component
}

const props = defineProps<Props>()
const route = useRoute()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const isItemActive = (path: string): boolean => route.path === path

const triggerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  backgroundColor: props.isActiveGroup
    ? 'rgba(59, 130, 246, 0.8)'
    : 'transparent',
  color: props.isActiveGroup ? '#fff' : 'rgba(255,255,255,0.7)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: props.isActiveGroup ? 600 : 500,
  fontSize: '0.85rem',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
}))

function onEnter(e: MouseEvent): void {
  if (props.isActiveGroup) return
  const t = e.currentTarget as HTMLElement
  t.style.backgroundColor = 'rgba(255,255,255,0.1)'
  t.style.color = '#fff'
}
function onLeave(e: MouseEvent): void {
  if (props.isActiveGroup || isOpen.value) return
  const t = e.currentTarget as HTMLElement
  t.style.backgroundColor = 'transparent'
  t.style.color = 'rgba(255,255,255,0.7)'
}

function itemStyle(path: string): CSSProperties {
  const active = isItemActive(path)
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    textDecoration: 'none',
    color: active ? '#3b82f6' : 'rgba(255,255,255,0.8)',
    backgroundColor: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
    transition: 'all 0.2s ease',
    fontSize: '0.85rem',
    fontWeight: active ? 600 : 400,
  }
}

function onItemEnter(e: MouseEvent, path: string): void {
  if (isItemActive(path)) return
  ;(e.currentTarget as HTMLElement).style.backgroundColor =
    'rgba(255,255,255,0.05)'
}
function onItemLeave(e: MouseEvent, path: string): void {
  if (isItemActive(path)) return
  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
}

function handleClickOutside(event: MouseEvent): void {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() =>
  document.removeEventListener('mousedown', handleClickOutside),
)
</script>

<template>
  <div ref="dropdownRef" style="position: relative">
    <button :style="triggerStyle" @click="isOpen = !isOpen" @mouseenter="onEnter" @mouseleave="onLeave">
      <span style="width: 18px; height: 18px; flex-shrink: 0">
        <component :is="icon" style="width: 18px; height: 18px" />
      </span>
      <span>{{ label }}</span>
      <ChevronDownIcon
        :style="{
          width: '14px',
          height: '14px',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }"
      />
    </button>

    <div
      v-if="isOpen"
      style="
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        background-color: #1e293b;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 180px;
        z-index: 1001;
        overflow: hidden;
      "
    >
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :style="itemStyle(item.to)"
        @click="isOpen = false"
        @mouseenter="onItemEnter($event, item.to)"
        @mouseleave="onItemLeave($event, item.to)"
      >
        <span style="width: 18px; height: 18px; flex-shrink: 0">
          <component :is="item.icon" style="width: 18px; height: 18px" />
        </span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </div>
  </div>
</template>
