<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div
    class="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <AppSkeleton class="h-6 w-48" rounded="lg" />
        <AppSkeleton class="mt-2 h-3 w-64 max-w-full" />
      </div>
      <AppSkeleton class="h-6 w-20" rounded="full" />
    </div>

    <div class="mt-6 grid gap-4" :class="compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2'">
      <div v-for="index in compact ? 4 : 6" :key="index" class="flex flex-col gap-2">
        <AppSkeleton class="h-3 w-20" />
        <AppSkeleton class="h-4 w-full" />
      </div>
    </div>

    <div v-if="!compact" class="mt-6 space-y-3">
      <AppSkeleton class="h-24 w-full" rounded="lg" />
      <div class="flex justify-end gap-2">
        <AppSkeleton class="h-9 w-24" rounded="md" />
        <AppSkeleton class="h-9 w-28" rounded="md" />
      </div>
    </div>
  </div>
</template>
