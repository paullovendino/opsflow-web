<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

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
    name?: string
    required?: boolean
  }>(),
  {
    disabled: false,
    optional: false,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const attrs = useAttrs()

const rootClass = computed(() => attrs.class)
const selectAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

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
  <div class="flex flex-col gap-1.5" :class="rootClass">
    <label :for="id" class="text-sm font-medium text-fg-secondary">{{ label }}</label>
    <div class="relative">
      <select
        :id="id"
        :name="name"
        class="h-10 w-full appearance-none rounded-md border border-border-strong bg-input py-0 pl-3 pr-10 text-sm leading-normal text-fg outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-fg-subtle"
        :class="{ 'border-red-500 focus:border-red-500 focus:ring-danger-border/60': Boolean(error) }"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :required="required"
        v-bind="selectAttrs"
        @change="onChange"
      >
        <option v-if="optional || placeholder" value="">
          {{ placeholder || 'Any' }}
        </option>
        <option v-for="option in options" :key="String(option.value)" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <svg
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        data-test="app-select-chevron"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
    <p v-if="error" class="text-sm text-danger-fg">{{ error }}</p>
  </div>
</template>
