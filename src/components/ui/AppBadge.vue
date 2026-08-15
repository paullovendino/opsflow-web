<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    tone?: 'neutral' | 'green' | 'slate' | 'sky' | 'amber' | 'emerald' | 'rose' | 'blue' | 'violet' | 'orange' | 'red'
  }>(),
  {
    tone: 'neutral',
  },
)

const toneClass: Record<string, string> = {
  neutral: 'bg-muted text-fg-secondary',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  slate: 'bg-muted text-fg-secondary',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
  orange: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="toneClass[tone]"
  >
    <slot>{{ label }}</slot>
  </span>
</template>
