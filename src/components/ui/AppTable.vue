<script setup lang="ts">
defineProps<{
  caption?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-border bg-surface shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-border text-left text-sm">
        <caption v-if="caption" class="sr-only">{{ caption }}</caption>
        <thead class="bg-muted text-xs font-semibold uppercase tracking-wide text-fg-muted">
          <slot name="head" />
        </thead>
        <tbody class="divide-y divide-border bg-surface">
          <slot />
        </tbody>
      </table>
    </div>
  </div>
</template>
