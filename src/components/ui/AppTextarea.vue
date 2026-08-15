<script setup lang="ts">
defineProps<{
  id: string
  label: string
  modelValue: string
  error?: string | null
  rows?: number
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-fg-secondary">{{ label }}</label>
    <textarea
      :id="id"
      :value="modelValue"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-md border border-border-strong bg-input px-3 py-2 text-sm text-fg outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': Boolean(error) }"
      v-bind="$attrs"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-sm text-danger-fg">{{ error }}</p>
  </div>
</template>
