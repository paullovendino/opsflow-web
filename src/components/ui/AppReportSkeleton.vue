<script setup lang="ts">
import AppCardSkeleton from '@/components/ui/AppCardSkeleton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppTableSkeleton from '@/components/ui/AppTableSkeleton.vue'
</script>

<template>
  <div class="flex flex-col gap-6" aria-busy="true" aria-live="polite">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <AppSkeleton class="h-10 w-full max-w-xs" rounded="lg" />
      <AppSkeleton class="h-10 w-full max-w-xs" rounded="lg" />
      <AppSkeleton class="h-10 w-24" rounded="md" />
    </div>

    <AppCardSkeleton :count="4" :columns="4" />

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AppSkeleton class="h-4 w-40" />
        <div class="mt-4 space-y-3">
          <div v-for="index in 5" :key="index" class="space-y-1">
            <div class="flex justify-between">
              <AppSkeleton class="h-3 w-24" />
              <AppSkeleton class="h-3 w-8" />
            </div>
            <AppSkeleton class="h-2 w-full" rounded="full" />
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AppSkeleton class="h-4 w-40" />
        <div class="mt-4 space-y-3">
          <div v-for="index in 4" :key="`p-${index}`" class="space-y-1">
            <div class="flex justify-between">
              <AppSkeleton class="h-3 w-24" />
              <AppSkeleton class="h-3 w-8" />
            </div>
            <AppSkeleton class="h-2 w-full" rounded="full" />
          </div>
        </div>
      </div>
    </div>

    <AppTableSkeleton :columns="4" :rows="5" />
  </div>
</template>
