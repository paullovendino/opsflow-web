<script setup lang="ts">
withDefaults(
  defineProps<{
    rounded?: 'md' | 'lg' | 'xl' | 'full'
  }>(),
  {
    rounded: 'md',
  },
)

const roundedClass: Record<string, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}
</script>

<template>
  <div class="opsflow-skeleton" :class="roundedClass[rounded]" aria-hidden="true" />
</template>
