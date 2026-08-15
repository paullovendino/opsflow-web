<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

withDefaults(
  defineProps<{
    columns?: number
    rows?: number
    showMobileCards?: boolean
  }>(),
  {
    columns: 6,
    rows: 6,
    showMobileCards: true,
  },
)
</script>

<template>
  <div class="flex flex-col gap-3" aria-busy="true" aria-live="polite">
    <div class="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
      <div
        class="grid gap-3 border-b border-border bg-muted px-4 py-3"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
      >
        <AppSkeleton v-for="col in columns" :key="`h-${col}`" class="h-3 w-20" />
      </div>
      <div
        v-for="row in rows"
        :key="`r-${row}`"
        class="grid gap-3 border-b border-border px-4 py-3 last:border-b-0"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
      >
        <AppSkeleton
          v-for="col in columns"
          :key="`c-${row}-${col}`"
          class="h-4 w-full"
        />
      </div>
    </div>

    <div v-if="showMobileCards" class="flex flex-col gap-3 md:hidden">
      <div
        v-for="index in Math.min(rows, 4)"
        :key="`m-${index}`"
        class="rounded-xl border border-border bg-surface p-4"
      >
        <AppSkeleton class="h-4 w-2/3" rounded="lg" />
        <AppSkeleton class="mt-3 h-3 w-1/2" />
        <div class="mt-4 grid grid-cols-2 gap-2">
          <AppSkeleton class="h-8" rounded="lg" />
          <AppSkeleton class="h-8" rounded="lg" />
        </div>
      </div>
    </div>
  </div>
</template>
