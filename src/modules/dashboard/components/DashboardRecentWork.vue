<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { DashboardRecentItem } from '@/types/dashboard'
import { formatDateTime, humanizeKey } from '@/utils/format'

defineProps<{
  items: DashboardRecentItem[]
}>()

function itemTitle(item: DashboardRecentItem): string {
  return item.type === 'project' ? item.name : item.title
}
</script>

<template>
  <ul class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface" role="list">
    <li
      v-for="item in items"
      :key="`${item.type}-${item.id}`"
      class="flex items-start gap-3 px-4 py-3"
    >
      <span
        class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-xs font-semibold uppercase text-fg-secondary"
        aria-hidden="true"
      >
        {{ item.type === 'project' ? 'P' : 'T' }}
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="truncate text-sm font-medium text-fg">{{ itemTitle(item) }}</p>
          <StatusBadge :status="item.status" :kind="item.type" />
        </div>
        <p class="mt-1 text-xs text-fg-muted">
          <span class="font-medium text-fg-subtle">{{ humanizeKey(item.type) }}</span>
          · Updated {{ formatDateTime(item.updated_at) }}
        </p>
      </div>
    </li>
  </ul>
</template>
