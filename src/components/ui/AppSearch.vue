<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = computed(() => props.id || 'app-search')

function onClear(): void {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="flex min-w-[12rem] flex-1 flex-col gap-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-fg-secondary">
      {{ label }}
    </label>
    <div class="relative">
      <svg
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        data-test="app-search-icon"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        :id="inputId"
        type="search"
        :value="modelValue"
        :placeholder="placeholder || 'Search…'"
        class="h-10 w-full rounded-md border border-border-strong bg-input py-0 pl-10 pr-10 text-sm leading-normal text-fg placeholder:text-fg-muted outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/40"
        data-test="app-search-input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="modelValue.length > 0"
        type="button"
        class="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-fg-muted hover:bg-surface-hover hover:text-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Clear search"
        data-test="app-search-clear"
        @click="onClear"
      >
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
