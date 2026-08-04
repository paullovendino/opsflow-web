<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <header v-if="title || description" class="flex flex-col gap-1">
      <h2 v-if="title" class="text-base font-semibold text-slate-900">{{ title }}</h2>
      <p v-if="description" class="text-sm text-slate-600">{{ description }}</p>
    </header>
    <div class="flex flex-col gap-4">
      <slot />
    </div>
  </section>
</template>
