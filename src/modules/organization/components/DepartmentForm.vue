<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppFormActions from '@/components/ui/AppFormActions.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import type { Department, DepartmentWritePayload } from '@/types/organization'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    initial?: Department | null
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
  submit: [payload: DepartmentWritePayload]
  cancel: []
}>()

const form = reactive({
  name: '',
  description: '',
})

const localErrors = reactive<Record<string, string | null>>({
  name: null,
  description: null,
})

function fieldError(key: string): string | null {
  return props.serverErrors?.[key]?.[0] ?? localErrors[key] ?? null
}

function hydrate(department: Department | null | undefined): void {
  if (!department) {
    form.name = ''
    form.description = ''
    return
  }

  form.name = department.name
  form.description = department.description ?? ''
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

  return ok
}

const submitLabel = computed(
  () => props.submitLabel || (props.mode === 'create' ? 'Create department' : 'Save changes'),
)

function onSubmit(): void {
  if (!validate()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim() || null,
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" data-test="department-form" @submit.prevent="onSubmit">
    <p
      v-if="formError"
      class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg"
      role="alert"
    >
      {{ formError }}
    </p>

    <AppInput
      id="department_name"
      v-model="form.name"
      label="Name"
      :error="fieldError('name')"
      autocomplete="off"
    />
    <AppTextarea
      id="department_description"
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
