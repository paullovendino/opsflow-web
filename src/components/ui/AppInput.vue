<script setup lang="ts">
defineProps<{
  id: string
  label: string
  type?: string
  modelValue: string
  error?: string | null
  autocomplete?: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-fg-secondary">{{ label }}</label>
    <input
      :id="id"
      :type="type ?? 'text'"
      :value="modelValue"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      class="w-full rounded-md border border-border-strong bg-input px-3 py-2 text-sm text-fg outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/40"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': Boolean(error) }"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-sm text-danger-fg">{{ error }}</p>
  </div>
</template>
