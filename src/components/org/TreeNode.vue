<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRightIcon, BriefcaseIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { UserAvatar } from '../ui'
import type { OrganizationNode } from '../../types/organization'

defineOptions({ name: 'TreeNode' })

interface Props {
  node: OrganizationNode & { children?: OrganizationNode[] }
  level: number
  userPhotos: Record<string, string | null>
}

const props = defineProps<Props>()
const emit = defineEmits<{ delete: [id: string, name: string] }>()

const children = computed(() => props.node.children || [])
const hasChildren = computed(() => children.value.length > 0)

const levelColors = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
]
const colorScheme = computed(
  () => levelColors[Math.min(props.level, levelColors.length - 1)],
)
</script>

<template>
  <div :style="{ marginLeft: level > 0 ? '28px' : '0' }">
    <div
      v-if="level > 0"
      style="position: relative; margin-left: -14px; margin-bottom: -8px"
    >
      <ChevronRightIcon
        style="
          width: 14px;
          height: 14px;
          color: #d1d5db;
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
        "
      />
    </div>

    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        backgroundColor: colorScheme.bg,
        borderRadius: '12px',
        marginBottom: '8px',
        borderLeft: `4px solid ${colorScheme.border}`,
        transition: 'all 0.2s',
      }"
    >
      <UserAvatar
        :name="node.userName"
        :photo-url="userPhotos[node.userId]"
        size="md"
        :show-border="false"
      />

      <div style="flex: 1">
        <div
          style="
            font-weight: 600;
            color: #1f2937;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 6px;
          "
        >
          {{ node.userName }}
          <span
            v-if="level === 0"
            :style="{
              padding: '2px 6px',
              backgroundColor: colorScheme.border,
              color: '#fff',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }"
          >
            CEO
          </span>
        </div>
        <div
          style="
            font-size: 0.8rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 4px;
          "
        >
          <BriefcaseIcon style="width: 12px; height: 12px" />
          {{ node.position }}
        </div>
      </div>

      <span
        v-if="hasChildren"
        style="
          padding: 3px 8px;
          background-color: rgba(0, 0, 0, 0.08);
          color: #6b7280;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        "
      >
        {{ children.length }} subordinado{{ children.length > 1 ? 's' : '' }}
      </span>

      <button
        title="Eliminar del árbol"
        style="
          width: 32px;
          height: 32px;
          background-color: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        "
        @click="emit('delete', node.id, node.userName)"
      >
        <TrashIcon style="width: 16px; height: 16px" />
      </button>
    </div>

    <TreeNode
      v-for="child in children"
      :key="child.id"
      :node="child"
      :level="level + 1"
      :user-photos="userPhotos"
      @delete="(id, name) => emit('delete', id, name)"
    />
  </div>
</template>
