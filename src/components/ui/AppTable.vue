<script setup lang="ts">
defineProps<{
  caption?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <caption v-if="caption" class="sr-only">{{ caption }}</caption>
        <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <slot name="head" />
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white">
          <slot />
        </tbody>
      </table>
    </div>
  </div>
</template>
