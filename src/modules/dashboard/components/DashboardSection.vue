<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-col gap-1">
      <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
      <p v-if="description" class="text-sm text-slate-600">{{ description }}</p>
    </header>
    <slot />
  </section>
</template>
