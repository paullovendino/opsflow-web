<script setup lang="ts">
import type { PaginationMeta } from '@/types/api'

const props = defineProps<{
  meta: PaginationMeta
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

function prev(): void {
  if (props.meta.current_page > 1) {
    emit('change', props.meta.current_page - 1)
  }
}

function next(): void {
  if (props.meta.current_page < props.meta.last_page) {
    emit('change', props.meta.current_page + 1)
  }
}
</script>

<template>
  <nav
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    aria-label="Pagination"
  >
    <p class="text-sm text-slate-600">
      <template v-if="meta.total === 0">No results</template>
      <template v-else>
        Showing
        <span class="font-medium text-slate-900">{{ meta.from ?? 0 }}</span>
        –
        <span class="font-medium text-slate-900">{{ meta.to ?? 0 }}</span>
        of
        <span class="font-medium text-slate-900">{{ meta.total }}</span>
      </template>
    </p>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled || meta.current_page <= 1"
        @click="prev"
      >
        Previous
      </button>
      <span class="text-sm text-slate-600">
        Page {{ meta.current_page }} of {{ meta.last_page }}
      </span>
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled || meta.current_page >= meta.last_page"
        @click="next"
      >
        Next
      </button>
    </div>
  </nav>
</template>
