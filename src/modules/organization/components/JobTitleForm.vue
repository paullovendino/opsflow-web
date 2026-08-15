<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppFormActions from '@/components/ui/AppFormActions.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import type { JobTitle, JobTitleWritePayload } from '@/types/organization'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    initial?: JobTitle | null
    departmentOptions: Array<{ value: number; label: string }>
    submitting?: boolean
    serverErrors?: Record<string, string[]> | null
    formError?: string | null
    submitLabel?: string | null
  }>(),
  {
    initial: null,
    submitting: false,
    serverErrors: null,
    formError: null,
    submitLabel: null,
  },
)

const emit = defineEmits<{
  submit: [payload: JobTitleWritePayload]
  cancel: []
}>()

const form = reactive({
  name: '',
  description: '',
  department_id: null as number | null,
})

const localErrors = reactive<Record<string, string | null>>({
  name: null,
  description: null,
  department_id: null,
})

function fieldError(key: string): string | null {
  return props.serverErrors?.[key]?.[0] ?? localErrors[key] ?? null
}

function hydrate(jobTitle: JobTitle | null | undefined): void {
  if (!jobTitle) {
    form.name = ''
    form.description = ''
    form.department_id = null
    return
  }

  form.name = jobTitle.name
  form.description = jobTitle.description ?? ''
  form.department_id = jobTitle.department_id
}

watch(
  () => props.initial,
  (value) => {
    hydrate(value)
  },
  { immediate: true },
)

function resetLocalErrors(): void {
  Object.keys(localErrors).forEach((key) => {
    localErrors[key] = null
  })
}

function validate(): boolean {
  resetLocalErrors()
  let ok = true

  if (!form.name.trim()) {
    localErrors.name = 'Name is required.'
    ok = false
  }
  if (form.department_id == null) {
    localErrors.department_id = 'Department is required.'
    ok = false
  }

  return ok
}

const submitLabel = computed(
  () => props.submitLabel || (props.mode === 'create' ? 'Create job title' : 'Save changes'),
)

function onSubmit(): void {
  if (!validate() || form.department_id == null) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim() || null,
    department_id: form.department_id,
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" data-test="job-title-form" @submit.prevent="onSubmit">
    <p
      v-if="formError"
      class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg"
      role="alert"
    >
      {{ formError }}
    </p>

    <AppSelect
      id="job_title_department_id"
      :model-value="form.department_id"
      label="Department"
      :options="departmentOptions"
      :error="fieldError('department_id')"
      placeholder="Select a department"
      @update:model-value="
        (value) => {
          form.department_id = typeof value === 'number' ? value : null
        }
      "
    />
    <AppInput
      id="job_title_name"
      v-model="form.name"
      label="Name"
      :error="fieldError('name')"
      autocomplete="off"
    />
    <AppTextarea
      id="job_title_description"
      v-model="form.description"
      label="Description"
      :error="fieldError('description')"
      :rows="3"
    />

    <AppFormActions>
      <AppButton type="button" variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" :loading="submitting">
        {{ submitLabel }}
      </AppButton>
    </AppFormActions>
  </form>
</template>
