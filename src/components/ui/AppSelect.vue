<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string
    label: string
    modelValue: string | number | null
    options: Array<{ value: string | number; label: string }>
    error?: string | null
    placeholder?: string
    disabled?: boolean
    optional?: boolean
  }>(),
  {
    disabled: false,
    optional: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

function onChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  const raw = target.value

  if (raw === '') {
    emit('update:modelValue', null)
    return
  }

  const asNumber = Number(raw)
  emit('update:modelValue', Number.isNaN(asNumber) ? raw : asNumber)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-slate-700">{{ label }}</label>
    <select
      :id="id"
      class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': Boolean(error) }"
      :value="modelValue ?? ''"
      :disabled="disabled"
      @change="onChange"
    >
      <option v-if="optional || placeholder" value="">
        {{ placeholder || 'Any' }}
      </option>
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
