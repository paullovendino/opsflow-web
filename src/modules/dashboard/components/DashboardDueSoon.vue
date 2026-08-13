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
  <ul class="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white" role="list">
    <li v-for="item in items" :key="item.id" data-test="due-soon-item">
      <RouterLink
        :to="{ name: 'tasks.show', params: { id: item.id } }"
        class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
      >
        <span
          class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold uppercase text-slate-700"
          aria-hidden="true"
        >
          T
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate text-sm font-medium text-slate-900">{{ item.title }}</p>
            <StatusBadge :status="item.priority" kind="priority" />
          </div>
          <p class="mt-1 text-xs text-slate-500">
            <span class="font-medium text-slate-600">{{ item.project?.name ?? 'No project' }}</span>
            <span class="text-slate-400"> · </span>
            <span :class="item.is_overdue ? 'font-medium text-rose-800' : 'text-slate-500'">
              {{ taskDueDateLabel(item.due_date, item.is_overdue) }}
            </span>
          </p>
        </div>
      </RouterLink>
    </li>
  </ul>
</template>
