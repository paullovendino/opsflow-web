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
    <label :for="id" class="text-sm font-medium text-fg-secondary">{{ label }}</label>
    <select
      :id="id"
      class="w-full rounded-md border border-border-strong bg-input px-3 py-2 text-sm text-fg outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted"
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
    <p v-if="error" class="text-sm text-danger-fg">{{ error }}</p>
  </div>
</template>
