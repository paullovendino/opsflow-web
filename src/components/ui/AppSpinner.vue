<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    block?: boolean
  }>(),
  {
    label: 'Loading',
    block: false,
  },
)
</script>

<template>
  <div
    class="inline-flex items-center justify-center gap-3 text-slate-600"
    :class="{ 'min-h-40 w-full': block }"
    role="status"
    aria-live="polite"
  >
    <span
      class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-r-transparent"
      aria-hidden="true"
    />
    <span class="text-sm">{{ label }}</span>
  </div>
</template>
