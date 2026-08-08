<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
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
  }>(),
  {
    task: null,
    lockedProjectId: null,
    availableProjects: () => [],
  },
)

const emit = defineEmits<{
  close: []
  saved: [task: Task]
}>()

const toast = useToast()
const submitting = ref(false)
const formError = ref<string | null>(null)
const serverErrors = ref<Record<string, string[]> | null>(null)
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
    formError.value = null
    serverErrors.value = null
    submitting.value = false
    void loadProjects()
    const projectId = props.lockedProjectId ?? props.task?.project?.id ?? null
    void loadAssignees(projectId)
  },
)

async function onSubmit(payload: TaskCreatePayload | TaskUpdatePayload): Promise<void> {
  submitting.value = true
  formError.value = null
  serverErrors.value = null

  try {
    const saved =
      props.mode === 'create'
        ? await taskService.createTask(payload as TaskCreatePayload)
        : await taskService.updateTask(props.task!.id, payload as TaskUpdatePayload)

    toast.success(props.mode === 'create' ? 'Task created.' : 'Task updated.')
    emit('saved', saved)
  } catch (error) {
    const apiError = toApiClientError(error)
    if (apiError.status === 422) {
      serverErrors.value = apiError.errors
      formError.value = apiError.message
      return
    }
    if (apiError.status === 403) {
      formError.value = apiError.message || 'You are not allowed to perform this action.'
      toast.error(formError.value)
      return
    }
    formError.value = apiError.message || 'Unable to save task.'
    toast.error(formError.value)
  } finally {
    submitting.value = false
  }
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
    @close="emit('close')"
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
      @submit="onSubmit"
      @cancel="emit('close')"
      @project-change="loadAssignees"
    />
  </AppModal>
</template>
