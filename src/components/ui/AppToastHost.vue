<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { toasts } = storeToRefs(ui)

const typeClass: Record<string, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
  error: 'border-danger-border bg-danger-soft text-danger-fg',
  info: 'border-border bg-elevated text-fg',
}
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start justify-between gap-3 rounded-md border px-4 py-3 shadow-sm"
      :class="typeClass[toast.type]"
      role="status"
    >
      <p class="text-sm">{{ toast.message }}</p>
      <button
        type="button"
        class="text-xs font-medium uppercase tracking-wide opacity-70 hover:opacity-100"
        @click="ui.dismissToast(toast.id)"
      >
        Close
      </button>
    </div>
  </div>
</template>
