<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

withDefaults(
  defineProps<{
    count?: number
    columns?: number
  }>(),
  {
    count: 4,
    columns: 4,
  },
)
</script>

<template>
  <div
    class="grid gap-4"
    :class="{
      'sm:grid-cols-2 xl:grid-cols-4': columns === 4,
      'sm:grid-cols-2 xl:grid-cols-3': columns === 3,
      'sm:grid-cols-2': columns === 2,
    }"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="index in count"
      :key="index"
      class="rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <AppSkeleton class="h-3 w-24" />
      <AppSkeleton class="mt-3 h-8 w-16" rounded="lg" />
      <AppSkeleton class="mt-2 h-2 w-20" />
    </div>
  </div>
</template>
