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
  neutral: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-800',
  slate: 'bg-slate-100 text-slate-700',
  sky: 'bg-sky-100 text-sky-800',
  amber: 'bg-amber-100 text-amber-900',
  emerald: 'bg-emerald-100 text-emerald-800',
  rose: 'bg-rose-100 text-rose-800',
  blue: 'bg-blue-100 text-blue-800',
  violet: 'bg-violet-100 text-violet-800',
  orange: 'bg-orange-100 text-orange-900',
  red: 'bg-red-100 text-red-800',
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
