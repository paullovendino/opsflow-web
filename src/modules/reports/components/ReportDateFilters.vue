<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const props = defineProps<{
  fromDate: string
  toDate: string
}>()

const emit = defineEmits<{
  'update:fromDate': [value: string]
  'update:toDate': [value: string]
  apply: []
  clear: []
}>()

const rangeError = computed(() => {
  if (props.fromDate && props.toDate && props.toDate < props.fromDate) {
    return 'End date must be on or after the start date.'
  }
  return null
})

const hasDates = computed(() => Boolean(props.fromDate || props.toDate))
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
    <AppInput
      id="report_from_date"
      :model-value="fromDate"
      class="min-w-[10rem] flex-1"
      label="From date"
      type="date"
      :error="rangeError"
      @update:model-value="emit('update:fromDate', $event)"
    />
    <AppInput
      id="report_to_date"
      :model-value="toDate"
      class="min-w-[10rem] flex-1"
      label="To date"
      type="date"
      @update:model-value="emit('update:toDate', $event)"
    />
    <div class="flex gap-2">
      <AppButton type="button" :disabled="Boolean(rangeError)" @click="emit('apply')">
        Apply
      </AppButton>
      <AppButton type="button" variant="secondary" :disabled="!hasDates" @click="emit('clear')">
        Clear dates
      </AppButton>
    </div>
  </div>
</template>
