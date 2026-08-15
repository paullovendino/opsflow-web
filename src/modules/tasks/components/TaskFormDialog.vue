<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { createMutationAfterSaveController } from '@/composables/useMutationAfterSave'
import { useToast } from '@/composables/useToast'
import TaskForm from '@/modules/tasks/components/TaskForm.vue'
import * as projectService from '@/services/projectService'
import * as taskService from '@/services/taskService'
import type { Task, TaskCreatePayload, TaskUpdatePayload } from '@/types/task'
import { toApiClientError } from '@/utils/errors'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    task?: Task | null
    lockedProjectId?: number | null
    availableProjects?: Array<{ value: number; label: string }>
    afterSave: (task: Task) => Promise<void>
  }>(),
  {
    task: null,
    lockedProjectId: null,
    availableProjects: () => [],
  },
)

const emit = defineEmits<{
  close: []
}>()

const toast = useToast()
const { submitting, formError, serverErrors, refreshPending, reset, run } =
  createMutationAfterSaveController()
const projectOptions = ref<Array<{ value: number; label: string }>>([])
const assigneeOptions = ref<Array<{ value: number; label: string }>>([])
const projectsLoading = ref(false)
const assigneesLoading = ref(false)

async function loadProjects(): Promise<void> {
  if (props.lockedProjectId != null) return
  if (props.availableProjects.length > 0) {
    projectOptions.value = props.availableProjects
    return
  }
  projectsLoading.value = true
  try {
    const result = await projectService.listProjects({
      per_page: 100,
      sort: 'name',
      direction: 'asc',
    })
    projectOptions.value = result.projects.map((project) => ({
      value: project.id,
      label: project.name,
    }))
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to load projects.')
    projectOptions.value = []
  } finally {
    projectsLoading.value = false
  }
}

async function loadAssignees(projectId: number | null): Promise<void> {
  if (projectId == null) {
    assigneeOptions.value = []
    return
  }

  assigneesLoading.value = true
  try {
    const [project, members] = await Promise.all([
      projectService.getProject(projectId, { quietProgress: true }),
      projectService.listProjectMembers(projectId, { quietProgress: true }),
    ])

    const options: Array<{ value: number; label: string }> = []
    const seen = new Set<number>()

    if (project.owner) {
      options.push({
        value: project.owner.id,
        label: `${project.owner.full_name} (owner)`,
      })
      seen.add(project.owner.id)
    }

    for (const member of members) {
      if (seen.has(member.id)) continue
      options.push({
        value: member.id,
        label: `${member.full_name} (${member.email})`,
      })
      seen.add(member.id)
    }

    assigneeOptions.value = options
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to load assignees.')
    assigneeOptions.value = []
  } finally {
    assigneesLoading.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    reset()
    void loadProjects()
    const projectId = props.lockedProjectId ?? props.task?.project?.id ?? null
    void loadAssignees(projectId)
  },
)

async function onSubmit(payload: TaskCreatePayload | TaskUpdatePayload): Promise<void> {
  await run({
    mode: props.mode,
    mutate: () =>
      props.mode === 'create'
        ? taskService.createTask(payload as TaskCreatePayload)
        : taskService.updateTask(props.task!.id, payload as TaskUpdatePayload),
    afterSave: props.afterSave,
    refreshFailureMessage:
      props.mode === 'create'
        ? 'Task was created, but the list could not be updated. Please try again.'
        : 'Task was updated, but the list could not be updated. Please try again.',
    onForbiddenToast: (message) => toast.error(message),
    fallbackErrorMessage: 'Unable to save task.',
  })
}

function onClose(): void {
  if (submitting.value) {
    return
  }
  emit('close')
}
</script>

<template>
  <AppModal
    :open="open"
    :title="mode === 'create' ? 'Create task' : 'Edit task'"
    :description="
      mode === 'create'
        ? 'Add a task to a project. Status starts as To Do.'
        : 'Update task details. Use status and assignment controls separately.'
    "
    size="xl"
    :busy="submitting"
    @close="onClose"
  >
    <TaskForm
      :mode="mode"
      :initial="task"
      :locked-project-id="lockedProjectId"
      :project-options="projectOptions"
      :assignee-options="assigneeOptions"
      :projects-loading="projectsLoading"
      :assignees-loading="assigneesLoading"
      :submitting="submitting"
      :server-errors="serverErrors"
      :form-error="formError"
      :submit-label="refreshPending ? 'Retry update' : undefined"
      @submit="onSubmit"
      @cancel="onClose"
      @project-change="loadAssignees"
    />
  </AppModal>
</template>
