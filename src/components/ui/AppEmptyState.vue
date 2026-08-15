<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12"
    role="status"
  >
    <h2 class="text-lg font-semibold text-fg">{{ title }}</h2>
    <p v-if="description" class="max-w-xl text-sm leading-relaxed text-fg-subtle">{{ description }}</p>
    <div v-if="$slots.action" class="mt-3">
      <slot name="action" />
    </div>
  </div>
</template>
