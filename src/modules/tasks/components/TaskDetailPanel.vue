<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import * as projectService from '@/services/projectService'
import * as taskService from '@/services/taskService'
import type { Task, TaskStatus } from '@/types/task'
import { TASK_STATUSES } from '@/types/task'
import { toApiClientError } from '@/utils/errors'
import { formatDateTime, humanizeKey } from '@/utils/format'
import { taskDueDateLabel } from '@/utils/taskDueDate'

const props = defineProps<{
  task: Task
  canEdit: boolean
  canAssign: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  edit: [task: Task]
  remove: [task: Task]
  updated: [task: Task]
}>()

const toast = useToast()
const { roleName, user: currentUser } = useAuth()

const statusSaving = ref(false)
const assignmentSaving = ref(false)
const selectedStatus = ref<TaskStatus>('todo')
const selectedAssignee = ref<number | null>(null)
const assigneeOptions = ref<Array<{ value: number; label: string }>>([])
const assigneesLoading = ref(false)

const canChangeStatus = computed(() => {
  if (roleName.value === 'administrator' || roleName.value === 'project_manager') return true
  if (roleName.value !== 'employee') return false
  return props.task.assignee?.id != null && props.task.assignee.id === currentUser.value?.id
})

const statusOptions = TASK_STATUSES.map((status) => ({
  value: status,
  label: humanizeKey(status),
}))

watch(
  () => props.task,
  (task) => {
    selectedStatus.value = (TASK_STATUSES.includes(task.status as TaskStatus)
      ? task.status
      : 'todo') as TaskStatus
    selectedAssignee.value = task.assignee?.id ?? null
    void loadAssignees(task.project?.id ?? null)
  },
  { immediate: true },
)

async function loadAssignees(projectId: number | null): Promise<void> {
  if (!props.canAssign || projectId == null) {
    assigneeOptions.value = []
    return
  }

  assigneesLoading.value = true
  try {
    const [project, members] = await Promise.all([
      projectService.getProject(projectId),
      projectService.listProjectMembers(projectId),
    ])
    const options: Array<{ value: number; label: string }> = []
    const seen = new Set<number>()
    if (project.owner) {
      options.push({ value: project.owner.id, label: `${project.owner.full_name} (owner)` })
      seen.add(project.owner.id)
    }
    for (const member of members) {
      if (seen.has(member.id)) continue
      options.push({ value: member.id, label: `${member.full_name} (${member.email})` })
      seen.add(member.id)
    }
    assigneeOptions.value = options
  } catch {
    assigneeOptions.value = []
  } finally {
    assigneesLoading.value = false
  }
}

async function saveStatus(): Promise<void> {
  statusSaving.value = true
  try {
    const updated = await taskService.updateTaskStatus(props.task.id, {
      status: selectedStatus.value,
    })
    emit('updated', updated)
    toast.success('Task status updated.')
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to update status.')
  } finally {
    statusSaving.value = false
  }
}

async function saveAssignment(): Promise<void> {
  assignmentSaving.value = true
  try {
    const updated = await taskService.updateTaskAssignment(props.task.id, {
      assigned_to: selectedAssignee.value,
    })
    emit('updated', updated)
    toast.success('Task assignment updated.')
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to update assignment.')
  } finally {
    assignmentSaving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-fg">{{ task.title }}</h2>
        <p class="mt-1 text-sm text-fg-subtle">
          Project: {{ task.project?.name || '—' }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <StatusBadge :status="String(task.status)" kind="task" />
        <StatusBadge :status="String(task.priority)" kind="priority" />
      </div>
    </div>

    <dl class="grid gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <dt class="text-sm text-fg-muted">Description</dt>
        <dd class="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">
          {{ task.description || '—' }}
        </dd>
      </div>
      <div>
        <dt class="text-sm text-fg-muted">Assignee</dt>
        <dd class="mt-1 text-sm text-fg-secondary">{{ task.assignee?.full_name || 'Unassigned' }}</dd>
      </div>
      <div>
        <dt class="text-sm text-fg-muted">Creator</dt>
        <dd class="mt-1 text-sm text-fg-secondary">{{ task.creator?.full_name || '—' }}</dd>
      </div>
      <div>
        <dt class="text-sm text-fg-muted">Due date</dt>
        <dd
          class="mt-1 text-sm"
          :class="task.is_overdue ? 'font-medium text-rose-800' : 'text-fg-secondary'"
          data-test="task-detail-due-date"
        >
          {{ taskDueDateLabel(task.due_date, task.is_overdue, 'medium') }}
        </dd>
      </div>
      <div>
        <dt class="text-sm text-fg-muted">Priority</dt>
        <dd class="mt-1">
          <StatusBadge :status="String(task.priority)" kind="priority" />
        </dd>
      </div>
      <div>
        <dt class="text-sm text-fg-muted">Created</dt>
        <dd class="mt-1 text-sm text-fg-secondary">{{ formatDateTime(task.created_at) }}</dd>
      </div>
    </dl>

    <section v-if="canChangeStatus" class="rounded-lg border border-border bg-muted p-4">
      <h3 class="text-sm font-semibold text-fg">Status</h3>
      <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <AppSelect
          id="task_detail_status"
          :model-value="selectedStatus"
          class="min-w-0 flex-1"
          label="Change status"
          :options="statusOptions"
          :disabled="statusSaving"
          @update:model-value="
            (value) => {
              if (TASK_STATUSES.includes(value as TaskStatus)) {
                selectedStatus = value as TaskStatus
              }
            }
          "
        />
        <AppButton type="button" :loading="statusSaving" @click="saveStatus">Update status</AppButton>
      </div>
    </section>

    <section v-if="canAssign" class="rounded-lg border border-border bg-muted p-4">
      <h3 class="text-sm font-semibold text-fg">Assignment</h3>
      <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <AppSelect
          id="task_detail_assignee"
          :model-value="selectedAssignee"
          class="min-w-0 flex-1"
          label="Assignee"
          :options="assigneeOptions"
          :disabled="assigneesLoading || assignmentSaving"
          optional
          placeholder="Unassigned"
          @update:model-value="
            (value) => {
              selectedAssignee = typeof value === 'number' ? value : null
            }
          "
        />
        <AppButton type="button" :loading="assignmentSaving" @click="saveAssignment">
          Save assignment
        </AppButton>
      </div>
    </section>

    <div v-if="canEdit || canDelete" class="flex flex-wrap justify-end gap-2">
      <AppButton v-if="canEdit" type="button" variant="secondary" @click="emit('edit', task)">
        Edit
      </AppButton>
      <AppButton v-if="canDelete" type="button" variant="danger" @click="emit('remove', task)">
        Delete
      </AppButton>
    </div>
  </div>
</template>
