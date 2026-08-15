<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  hint?: string
}>()
</script>

<template>
  <article class="rounded-xl border border-border bg-surface p-4 shadow-sm">
    <p class="text-sm font-medium text-fg-muted">{{ label }}</p>
    <p class="mt-2 text-3xl font-semibold tracking-tight text-fg">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-fg-muted">{{ hint }}</p>
  </article>
</template>
