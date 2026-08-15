<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppFormActions from '@/components/ui/AppFormActions.vue'
import AppFormSection from '@/components/ui/AppFormSection.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import type { Project, ProjectWritePayload } from '@/types/project'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    initial?: Project | null
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
  submit: [payload: ProjectWritePayload]
  cancel: []
}>()

const form = reactive({
  name: '',
  description: '',
  start_date: '',
  due_date: '',
})

const localErrors = reactive<Record<string, string | null>>({
  name: null,
  description: null,
  start_date: null,
  due_date: null,
})

function fieldError(key: string): string | null {
  return props.serverErrors?.[key]?.[0] ?? localErrors[key] ?? null
}

function hydrate(project: Project | null | undefined): void {
  if (!project) {
    form.name = ''
    form.description = ''
    form.start_date = ''
    form.due_date = ''
    return
  }

  form.name = project.name
  form.description = project.description ?? ''
  form.start_date = project.start_date ?? ''
  form.due_date = project.due_date ?? ''
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

  if (form.start_date && form.due_date && form.due_date < form.start_date) {
    localErrors.due_date = 'Due date must be on or after the start date.'
    ok = false
  }

  return ok
}

function onSubmit(): void {
  if (!validate()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim() || null,
    start_date: form.start_date || null,
    due_date: form.due_date || null,
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p v-if="formError" class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg" role="alert">
      {{ formError }}
    </p>

    <AppFormSection
      title="Project details"
      :description="
        mode === 'create'
          ? 'New projects start in Planning. Status can be changed after create.'
          : 'Update project information. Status is changed separately.'
      "
    >
      <div class="grid gap-4">
        <AppInput
          id="project_name"
          v-model="form.name"
          label="Name"
          autocomplete="off"
          :error="fieldError('name')"
        />
        <AppTextarea
          id="project_description"
          v-model="form.description"
          label="Description"
          :rows="4"
          :error="fieldError('description')"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            id="project_start_date"
            v-model="form.start_date"
            label="Start date"
            type="date"
            :error="fieldError('start_date')"
          />
          <AppInput
            id="project_due_date"
            v-model="form.due_date"
            label="Due date"
            type="date"
            :error="fieldError('due_date')"
          />
        </div>
      </div>
    </AppFormSection>

    <AppFormActions>
      <AppButton type="button" variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" :loading="submitting">
        {{ submitLabel || (mode === 'create' ? 'Create project' : 'Save changes') }}
      </AppButton>
    </AppFormActions>
  </form>
</template>
