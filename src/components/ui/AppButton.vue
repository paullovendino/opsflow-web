<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'danger'
    loading?: boolean
    loadingLabel?: string
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    loading: false,
    disabled: false,
  },
)

const variantClass: Record<string, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}
</script>

<template>
  <button
    :type="type"
    class="relative inline-flex min-w-[6.5rem] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
    :class="variantClass[variant]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span
      v-if="loading"
      class="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
    <span class="truncate">
      <template v-if="loading && loadingLabel">{{ loadingLabel }}</template>
      <slot v-else />
    </span>
  </button>
</template>
