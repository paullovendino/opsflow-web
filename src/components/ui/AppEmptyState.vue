<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-start gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10">
    <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
    <p v-if="description" class="max-w-xl text-sm text-slate-600">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
