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
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-slate-700">{{ label }}</label>
    <textarea
      :id="id"
      :value="modelValue"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': Boolean(error) }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
