<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { DashboardDueSoonItem } from '@/types/dashboard'
import { taskDueDateLabel } from '@/utils/taskDueDate'

defineProps<{
  items: DashboardDueSoonItem[]
}>()
</script>

<template>
  <ul class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface" role="list">
    <li v-for="item in items" :key="item.id" data-test="due-soon-item">
      <RouterLink
        :to="{ name: 'tasks.show', params: { id: item.id } }"
        class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:bg-muted focus-visible:outline-none"
      >
        <span
          class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-xs font-semibold uppercase text-fg-secondary"
          aria-hidden="true"
        >
          T
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate text-sm font-medium text-fg">{{ item.title }}</p>
            <StatusBadge :status="item.priority" kind="priority" />
          </div>
          <p class="mt-1 text-xs text-fg-muted">
            <span class="font-medium text-fg-subtle">{{ item.project?.name ?? 'No project' }}</span>
            <span class="text-fg-muted"> · </span>
            <span :class="item.is_overdue ? 'font-medium text-rose-800' : 'text-fg-muted'">
              {{ taskDueDateLabel(item.due_date, item.is_overdue) }}
            </span>
          </p>
        </div>
      </RouterLink>
    </li>
  </ul>
</template>
