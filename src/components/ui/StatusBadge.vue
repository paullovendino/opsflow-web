<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { humanizeKey } from '@/utils/format'

type BadgeTone =
  | 'neutral'
  | 'green'
  | 'slate'
  | 'sky'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'blue'
  | 'violet'
  | 'orange'
  | 'red'

const props = defineProps<{
  status: string
  kind?: 'project' | 'task' | 'user' | 'generic'
}>()

const tone = computed<BadgeTone>(() => {
  const map: Record<string, BadgeTone> = {
    active: 'green',
    inactive: 'slate',
    planning: 'sky',
    on_hold: 'amber',
    completed: 'emerald',
    cancelled: 'rose',
    archived: 'slate',
    todo: 'slate',
    in_progress: 'blue',
    in_review: 'violet',
    blocked: 'amber',
  }

  return map[props.status] ?? 'neutral'
})
</script>

<template>
  <AppBadge :tone="tone" :label="humanizeKey(status)" />
</template>
