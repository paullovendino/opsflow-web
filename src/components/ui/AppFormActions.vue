<script setup lang="ts">
defineProps<{
  align?: 'start' | 'end'
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4"
    :class="align === 'start' ? 'justify-start' : 'justify-end'"
  >
    <slot />
  </div>
</template>
