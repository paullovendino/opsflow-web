<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  id?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex min-w-[12rem] flex-1 flex-col gap-1.5">
    <label v-if="label" :for="id || 'app-search'" class="text-sm font-medium text-fg-secondary">
      {{ label }}
    </label>
    <input
      :id="id || 'app-search'"
      type="search"
      :value="modelValue"
      :placeholder="placeholder || 'Search…'"
      class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/40"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
