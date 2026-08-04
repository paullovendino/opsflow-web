<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  hint?: string
}>()
</script>

<template>
  <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p class="text-sm font-medium text-slate-500">{{ label }}</p>
    <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </article>
</template>
