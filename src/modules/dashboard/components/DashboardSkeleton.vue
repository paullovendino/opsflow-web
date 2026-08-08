<script setup lang="ts">
import AppCardSkeleton from '@/components/ui/AppCardSkeleton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
</script>

<template>
  <div class="flex flex-col gap-6" aria-busy="true" aria-live="polite">
    <AppCardSkeleton :count="4" :columns="4" />

    <div>
      <AppSkeleton class="mb-3 h-4 w-40" />
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <AppSkeleton class="h-4 w-36" />
          <div class="mt-4 space-y-3">
            <div v-for="index in 5" :key="index" class="space-y-1">
              <div class="flex justify-between gap-3">
                <AppSkeleton class="h-3 w-24" />
                <AppSkeleton class="h-3 w-8" />
              </div>
              <AppSkeleton class="h-2 w-full" rounded="full" />
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <AppSkeleton class="h-4 w-36" />
          <div class="mt-4 space-y-3">
            <div v-for="index in 4" :key="`p-${index}`" class="space-y-1">
              <div class="flex justify-between gap-3">
                <AppSkeleton class="h-3 w-24" />
                <AppSkeleton class="h-3 w-8" />
              </div>
              <AppSkeleton class="h-2 w-full" rounded="full" />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AppSkeleton class="h-4 w-40" />
        <div class="mt-4 space-y-3">
          <div v-for="index in 4" :key="`s-${index}`" class="space-y-1">
            <div class="flex justify-between gap-3">
              <AppSkeleton class="h-3 w-28" />
              <AppSkeleton class="h-3 w-8" />
            </div>
            <AppSkeleton class="h-2 w-full" rounded="full" />
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <AppSkeleton class="h-4 w-32" />
      <div class="mt-4 space-y-3">
        <div v-for="index in 4" :key="`r-${index}`" class="flex items-center gap-3">
          <AppSkeleton class="h-9 w-9 shrink-0" rounded="full" />
          <div class="min-w-0 flex-1 space-y-2">
            <AppSkeleton class="h-3 w-2/3" />
            <AppSkeleton class="h-3 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
