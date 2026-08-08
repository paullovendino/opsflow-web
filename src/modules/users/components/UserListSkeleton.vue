<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppTableSkeleton from '@/components/ui/AppTableSkeleton.vue'
</script>

<template>
  <div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <AppSkeleton class="h-10 w-full max-w-sm" rounded="lg" />
        <AppSkeleton class="h-10 w-full max-w-[10rem]" rounded="lg" />
        <AppSkeleton class="h-10 w-20" rounded="md" />
      </div>
    </div>
    <AppTableSkeleton :columns="7" :rows="6" />
  </div>
</template>
