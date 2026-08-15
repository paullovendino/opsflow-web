<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppFormActions from '@/components/ui/AppFormActions.vue'
import AppFormSection from '@/components/ui/AppFormSection.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import type { Task, TaskCreatePayload, TaskPriority, TaskUpdatePayload } from '@/types/task'
import { TASK_PRIORITIES } from '@/types/task'
import { humanizeKey } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    initial?: Task | null
    lockedProjectId?: number | null
    projectOptions?: Array<{ value: number; label: string }>
    assigneeOptions?: Array<{ value: number; label: string }>
    projectsLoading?: boolean
    assigneesLoading?: boolean
    submitting?: boolean
    serverErrors?: Record<string, string[]> | null
    formError?: string | null
  }>(),
  {
    initial: null,
    lockedProjectId: null,
    projectOptions: () => [],
    assigneeOptions: () => [],
    projectsLoading: false,
    assigneesLoading: false,
    submitting: false,
    serverErrors: null,
    formError: null,
  },
)

const emit = defineEmits<{
  submit: [payload: TaskCreatePayload | TaskUpdatePayload]
  cancel: []
  'project-change': [projectId: number | null]
}>()

const form = reactive({
  project_id: null as number | null,
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  due_date: '',
  assigned_to: null as number | null,
})

const localErrors = reactive<Record<string, string | null>>({
  project_id: null,
  title: null,
  description: null,
  priority: null,
  due_date: null,
  assigned_to: null,
})

const priorityOptions = TASK_PRIORITIES.map((priority) => ({
  value: priority,
  label: humanizeKey(priority),
}))

const showProjectSelect = computed(() => props.mode === 'create' && props.lockedProjectId == null)

function fieldError(key: string): string | null {
  return props.serverErrors?.[key]?.[0] ?? localErrors[key] ?? null
}

function hydrate(task: Task | null | undefined): void {
  if (!task) {
    form.project_id = props.lockedProjectId
    form.title = ''
    form.description = ''
    form.priority = 'medium'
    form.due_date = ''
    form.assigned_to = null
    return
  }

  form.project_id = task.project?.id ?? props.lockedProjectId
  form.title = task.title
  form.description = task.description ?? ''
  form.priority = (TASK_PRIORITIES.includes(task.priority as TaskPriority)
    ? task.priority
    : 'medium') as TaskPriority
  form.due_date = task.due_date ?? ''
  form.assigned_to = task.assignee?.id ?? null
}

watch(
  () => [props.initial, props.lockedProjectId, props.mode] as const,
  () => {
    hydrate(props.initial)
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

  if (props.mode === 'create') {
    const projectId = props.lockedProjectId ?? form.project_id
    if (projectId == null) {
      localErrors.project_id = 'Project is required.'
      ok = false
    }
  }

  if (!form.title.trim()) {
    localErrors.title = 'Title is required.'
    ok = false
  }

  if (!TASK_PRIORITIES.includes(form.priority)) {
    localErrors.priority = 'Priority is required.'
    ok = false
  }

  return ok
}

function onProjectUpdate(value: string | number | null): void {
  form.project_id = typeof value === 'number' ? value : null
  form.assigned_to = null
  emit('project-change', form.project_id)
}

function onSubmit(): void {
  if (!validate()) return

  if (props.mode === 'create') {
    const projectId = (props.lockedProjectId ?? form.project_id)!
    emit('submit', {
      project_id: projectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to,
    } satisfies TaskCreatePayload)
    return
  }

  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim() || null,
    priority: form.priority,
    due_date: form.due_date || null,
  } satisfies TaskUpdatePayload)
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <p
      v-if="formError"
      class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg"
      role="alert"
    >
      {{ formError }}
    </p>

    <AppFormSection
      title="Task details"
      :description="
        mode === 'create'
          ? 'New tasks start as To Do. Assignment is optional at create time.'
          : 'Update task details. Status and assignment are changed separately.'
      "
    >
      <div class="grid gap-4">
        <AppSelect
          v-if="showProjectSelect"
          id="task_project_id"
          :model-value="form.project_id"
          label="Project"
          :options="projectOptions"
          :disabled="projectsLoading || submitting"
          :error="fieldError('project_id')"
          placeholder="Select a project"
          @update:model-value="onProjectUpdate"
        />

        <AppInput
          id="task_title"
          v-model="form.title"
          label="Title"
          autocomplete="off"
          :error="fieldError('title')"
        />

        <AppTextarea
          id="task_description"
          v-model="form.description"
          label="Description"
          :rows="4"
          :error="fieldError('description')"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            id="task_priority"
            :model-value="form.priority"
            label="Priority"
            :options="priorityOptions"
            :error="fieldError('priority')"
            @update:model-value="
              (value) => {
                if (TASK_PRIORITIES.includes(value as TaskPriority)) {
                  form.priority = value as TaskPriority
                }
              }
            "
          />
          <AppInput
            id="task_due_date"
            v-model="form.due_date"
            label="Due date"
            type="date"
            :error="fieldError('due_date')"
          />
        </div>

        <AppSelect
          v-if="mode === 'create'"
          id="task_assigned_to"
          :model-value="form.assigned_to"
          label="Assignee"
          :options="assigneeOptions"
          :disabled="assigneesLoading || submitting || (lockedProjectId == null && form.project_id == null)"
          optional
          placeholder="Unassigned"
          :error="fieldError('assigned_to')"
          @update:model-value="
            (value) => {
              form.assigned_to = typeof value === 'number' ? value : null
            }
          "
        />
      </div>
    </AppFormSection>

    <AppFormActions>
      <AppButton type="button" variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" :loading="submitting">
        {{ mode === 'create' ? 'Create task' : 'Save changes' }}
      </AppButton>
    </AppFormActions>
  </form>
</template>
