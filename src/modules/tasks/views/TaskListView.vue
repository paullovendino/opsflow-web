<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFilterBar from '@/components/ui/AppFilterBar.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSearch from '@/components/ui/AppSearch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTable from '@/components/ui/AppTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useTaskList } from '@/composables/useTaskList'
import { useToast } from '@/composables/useToast'
import TaskActionsMenu from '@/modules/tasks/components/TaskActionsMenu.vue'
import TaskAssignmentDialog from '@/modules/tasks/components/TaskAssignmentDialog.vue'
import TaskDetailDialog from '@/modules/tasks/components/TaskDetailDialog.vue'
import TaskFormDialog from '@/modules/tasks/components/TaskFormDialog.vue'
import TaskListSkeleton from '@/modules/tasks/components/TaskListSkeleton.vue'
import * as projectService from '@/services/projectService'
import * as taskService from '@/services/taskService'
import type { Task, TaskPriority, TaskStatus } from '@/types/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/task'
import { toApiClientError } from '@/utils/errors'
import { formatDateTime, humanizeKey } from '@/utils/format'
import { taskDueDateLabel } from '@/utils/taskDueDate'

const route = useRoute()
const toast = useToast()
const { roleName, user: currentUser } = useAuth()

const {
  tasks,
  meta,
  filters,
  searchInput,
  isLoading,
  errorMessage,
  isEmpty,
  hasActiveFilters,
  retry,
  setPage,
  clearFilters,
  onSearchInput,
  onFilterChange,
  load,
  syncQuery,
  openModalAlias,
} = useTaskList()

const headingRef = ref<HTMLElement | null>(null)
const projectOptions = ref<Array<{ value: number; label: string }>>([])

const canMutate = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const statusOptions = TASK_STATUSES.map((status) => ({
  value: status,
  label: humanizeKey(status),
}))

const priorityOptions = TASK_PRIORITIES.map((priority) => ({
  value: priority,
  label: humanizeKey(priority),
}))

const overdueOptions = [{ value: '1', label: 'Overdue' }]

const formDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  task: null as Task | null,
})

const detailDialog = reactive({
  open: false,
  task: null as Task | null,
  loading: false,
  errorMessage: null as string | null,
})

const statusDialog = reactive({
  open: false,
  loading: false,
  task: null as Task | null,
  status: 'todo' as TaskStatus,
})

const assignDialog = reactive({
  open: false,
  task: null as Task | null,
})

const confirmDelete = reactive({
  open: false,
  loading: false,
  task: null as Task | null,
})

function canChangeStatus(task: Task): boolean {
  if (canMutate.value) return true
  return task.assignee?.id != null && task.assignee.id === currentUser.value?.id
}

async function syncRouteToIndex(): Promise<void> {
  if (route.name === 'tasks.create' || route.name === 'tasks.edit') {
    await syncQuery()
  }
}

function openCreate(): void {
  formDialog.mode = 'create'
  formDialog.task = null
  formDialog.open = true
  if (route.name !== 'tasks.create') {
    openModalAlias('tasks.create')
  }
}

function openEdit(task: Task): void {
  detailDialog.open = false
  formDialog.mode = 'edit'
  formDialog.task = task
  formDialog.open = true
  if (route.name !== 'tasks.edit' || Number(route.params.id) !== task.id) {
    openModalAlias('tasks.edit', { id: task.id })
  }
}

async function openView(task: Task): Promise<void> {
  detailDialog.open = true
  detailDialog.task = task
  detailDialog.loading = true
  detailDialog.errorMessage = null
  try {
    detailDialog.task = await taskService.getTask(task.id, { quietProgress: true })
  } catch (error) {
    const apiError = toApiClientError(error)
    detailDialog.errorMessage = apiError.message || 'Unable to load task.'
  } finally {
    detailDialog.loading = false
  }
}

function closeFormDialog(): void {
  formDialog.open = false
  formDialog.task = null
  void syncRouteToIndex()
}

function closeDetailDialog(): void {
  detailDialog.open = false
  detailDialog.task = null
  detailDialog.errorMessage = null
}

async function onSaved(task: Task): Promise<void> {
  formDialog.open = false
  formDialog.task = null
  await syncRouteToIndex()
  await load()
  await openView(task)
}

function onDetailUpdated(task: Task): void {
  detailDialog.task = task
  void load()
}

function askDelete(task: Task): void {
  detailDialog.open = false
  confirmDelete.task = task
  confirmDelete.open = true
}

function closeDelete(): void {
  if (confirmDelete.loading) return
  confirmDelete.open = false
  confirmDelete.task = null
}

async function runDelete(): Promise<void> {
  if (!confirmDelete.task) return
  confirmDelete.loading = true
  try {
    await taskService.deleteTask(confirmDelete.task.id)
    toast.success('Task deleted.')
    confirmDelete.open = false
    confirmDelete.task = null
    await load()
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to delete task.')
  } finally {
    confirmDelete.loading = false
  }
}

function openStatus(task: Task): void {
  statusDialog.task = task
  statusDialog.status = (TASK_STATUSES.includes(task.status as TaskStatus)
    ? task.status
    : 'todo') as TaskStatus
  statusDialog.open = true
}

function openAssign(task: Task): void {
  assignDialog.task = task
  assignDialog.open = true
}

function closeAssign(): void {
  assignDialog.open = false
  assignDialog.task = null
}

async function onAssigned(): Promise<void> {
  assignDialog.open = false
  assignDialog.task = null
  await load()
}

function closeStatus(): void {
  if (statusDialog.loading) return
  statusDialog.open = false
  statusDialog.task = null
}

async function saveStatus(): Promise<void> {
  if (!statusDialog.task) return
  statusDialog.loading = true
  try {
    await taskService.updateTaskStatus(statusDialog.task.id, { status: statusDialog.status })
    toast.success('Task status updated.')
    statusDialog.open = false
    statusDialog.task = null
    await load()
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to update status.')
  } finally {
    statusDialog.loading = false
  }
}

async function loadProjectOptions(): Promise<void> {
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
  } catch {
    projectOptions.value = []
  }
}

async function loadEditFromRoute(id: number): Promise<void> {
  formDialog.mode = 'edit'
  formDialog.open = true
  formDialog.task = tasks.value.find((item) => item.id === id) ?? null

  try {
    formDialog.task = await taskService.getTask(id, { quietProgress: true })
  } catch (error) {
    const apiError = toApiClientError(error)
    formDialog.open = false
    toast.error(apiError.message || 'Unable to load task for edit.')
    await syncRouteToIndex()
  }
}

watch(
  () => [route.name, route.params.id] as const,
  ([name, id]) => {
    if (name === 'tasks.create') {
      formDialog.mode = 'create'
      formDialog.task = null
      formDialog.open = true
      return
    }

    if (name === 'tasks.edit') {
      const taskId = Number(id)
      if (Number.isFinite(taskId)) {
        void loadEditFromRoute(taskId)
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await loadProjectOptions()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader title="Tasks" description="Search, filter, and manage tasks across projects.">
        <template #actions>
          <AppButton v-if="canMutate" @click="openCreate">Create task</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <AppFilterBar>
      <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <AppSearch
          :model-value="searchInput"
          label="Search"
          placeholder="Search title or description"
          @update:model-value="onSearchInput"
        />
        <AppSelect
          id="filter_task_status"
          :model-value="filters.status || null"
          class="min-w-[10rem] flex-1"
          label="Status"
          :options="statusOptions"
          optional
          placeholder="Any status"
          @update:model-value="
            (value) => {
              filters.status = TASK_STATUSES.includes(value as TaskStatus)
                ? (value as TaskStatus)
                : ''
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="filter_task_priority"
          :model-value="filters.priority || null"
          class="min-w-[10rem] flex-1"
          label="Priority"
          :options="priorityOptions"
          optional
          placeholder="Any priority"
          @update:model-value="
            (value) => {
              filters.priority = TASK_PRIORITIES.includes(value as TaskPriority)
                ? (value as TaskPriority)
                : ''
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="filter_task_project"
          :model-value="filters.project_id"
          class="min-w-[12rem] flex-1"
          label="Project"
          :options="projectOptions"
          optional
          placeholder="Any project"
          @update:model-value="
            (value) => {
              filters.project_id = typeof value === 'number' ? value : null
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="filter_task_overdue"
          :model-value="filters.overdue ? '1' : null"
          class="min-w-[10rem] flex-1"
          label="Overdue"
          :options="overdueOptions"
          optional
          placeholder="All"
          @update:model-value="
            (value) => {
              filters.overdue = value === 1 || value === '1'
              onFilterChange()
            }
          "
        />
        <AppInput
          id="filter_task_due_after"
          :model-value="filters.due_after"
          class="min-w-[10rem] flex-1"
          label="Due after"
          type="date"
          @update:model-value="
            (value) => {
              filters.due_after = value
              onFilterChange()
            }
          "
        />
        <AppInput
          id="filter_task_due_before"
          :model-value="filters.due_before"
          class="min-w-[10rem] flex-1"
          label="Due before"
          type="date"
          @update:model-value="
            (value) => {
              filters.due_before = value
              onFilterChange()
            }
          "
        />
        <div class="flex shrink-0 items-end">
          <AppButton
            variant="secondary"
            class="w-full lg:w-auto"
            data-test="task-filter-clear"
            :disabled="!hasActiveFilters"
            @click="clearFilters"
          >
            Clear
          </AppButton>
        </div>
      </div>
    </AppFilterBar>

    <TaskListSkeleton v-if="isLoading && tasks.length === 0" />

    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-red-900">Couldn't load tasks</h2>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else>
      <AppEmptyState
        v-if="isEmpty"
        :title="hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'"
        :description="
          hasActiveFilters ? 'Try adjusting search or filters.' : 'Create a task to get started.'
        "
      >
        <template v-if="canMutate && !hasActiveFilters" #action>
          <AppButton @click="openCreate">Create task</AppButton>
        </template>
        <template v-else-if="hasActiveFilters" #action>
          <AppButton variant="secondary" @click="clearFilters">Clear filters</AppButton>
        </template>
      </AppEmptyState>

      <template v-else>
        <div
          class="hidden md:block"
          :class="{ 'pointer-events-none opacity-60': isLoading }"
          :aria-busy="isLoading"
        >
          <AppTable caption="Tasks">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Title</th>
                <th scope="col" class="px-4 py-3">Project</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3">Priority</th>
                <th scope="col" class="px-4 py-3">Assignee</th>
                <th scope="col" class="px-4 py-3">Due</th>
                <th scope="col" class="px-4 py-3">Created</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </template>
            <tr v-for="task in tasks" :key="task.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">{{ task.title }}</td>
              <td class="px-4 py-3 text-slate-600">{{ task.project?.name || '—' }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="String(task.status)" kind="task" />
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="String(task.priority)" kind="priority" />
              </td>
              <td class="px-4 py-3 text-slate-600">{{ task.assignee?.full_name || 'Unassigned' }}</td>
              <td
                class="px-4 py-3"
                :class="task.is_overdue ? 'font-medium text-rose-800' : 'text-slate-600'"
                data-test="task-due-date"
              >
                {{ taskDueDateLabel(task.due_date, task.is_overdue) }}
              </td>
              <td class="px-4 py-3 text-slate-600">{{ formatDateTime(task.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <TaskActionsMenu
                  :task="task"
                  :can-edit="canMutate"
                  :can-delete="canMutate"
                  :can-change-status="canChangeStatus(task)"
                  @view="openView"
                  @edit="openEdit"
                  @change-status="openStatus"
                  @assign="openAssign"
                  @remove="askDelete"
                />
              </td>
            </tr>
          </AppTable>
        </div>

        <ul
          class="flex flex-col gap-3 md:hidden"
          role="list"
          :class="{ 'pointer-events-none opacity-60': isLoading }"
          :aria-busy="isLoading"
        >
          <li
            v-for="task in tasks"
            :key="`card-${task.id}`"
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-900">{{ task.title }}</p>
                <p class="truncate text-sm text-slate-600">{{ task.project?.name || '—' }}</p>
              </div>
              <StatusBadge :status="String(task.status)" kind="task" />
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <StatusBadge :status="String(task.priority)" kind="priority" />
              <span class="text-sm text-slate-600">
                {{ task.assignee?.full_name || 'Unassigned' }}
              </span>
              <span
                class="text-sm"
                :class="task.is_overdue ? 'font-medium text-rose-800' : 'text-slate-600'"
              >
                {{ taskDueDateLabel(task.due_date, task.is_overdue) }}
              </span>
            </div>
            <div class="mt-3 flex justify-end">
              <TaskActionsMenu
                :task="task"
                :can-edit="canMutate"
                :can-delete="canMutate"
                :can-change-status="canChangeStatus(task)"
                @view="openView"
                @edit="openEdit"
                @change-status="openStatus"
                @assign="openAssign"
                @remove="askDelete"
              />
            </div>
          </li>
        </ul>

        <AppPagination
          v-if="meta"
          class="mt-4"
          :meta="meta"
          :disabled="isLoading"
          @change="setPage"
        />
      </template>
    </template>

    <TaskFormDialog
      :open="formDialog.open"
      :mode="formDialog.mode"
      :task="formDialog.task"
      :available-projects="projectOptions"
      @close="closeFormDialog"
      @saved="onSaved"
    />

    <TaskDetailDialog
      :open="detailDialog.open"
      :task="detailDialog.task"
      :loading="detailDialog.loading"
      :error-message="detailDialog.errorMessage"
      :can-edit="canMutate"
      :can-assign="canMutate"
      :can-delete="canMutate"
      @close="closeDetailDialog"
      @edit="openEdit"
      @remove="askDelete"
      @updated="onDetailUpdated"
      @retry="detailDialog.task ? openView(detailDialog.task) : undefined"
    />

    <AppConfirmDialog
      :open="confirmDelete.open"
      title="Delete task"
      :description="
        confirmDelete.task
          ? `Soft-delete ${confirmDelete.task.title}? This removes it from the directory.`
          : undefined
      "
      confirm-label="Delete"
      variant="danger"
      :loading="confirmDelete.loading"
      @confirm="runDelete"
      @cancel="closeDelete"
    />

    <TaskAssignmentDialog
      :open="assignDialog.open"
      :task="assignDialog.task"
      @close="closeAssign"
      @saved="onAssigned"
    />

    <AppModal
      :open="statusDialog.open"
      title="Change task status"
      description="Any status is allowed; there is no transition graph."
      size="md"
      :busy="statusDialog.loading"
      @close="closeStatus"
    >
      <AppSelect
        id="task_status_dialog"
        :model-value="statusDialog.status"
        label="Status"
        :options="statusOptions"
        @update:model-value="
          (value) => {
            if (TASK_STATUSES.includes(value as TaskStatus)) {
              statusDialog.status = value as TaskStatus
            }
          }
        "
      />
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="statusDialog.loading" @click="closeStatus">
            Cancel
          </AppButton>
          <AppButton :loading="statusDialog.loading" @click="saveStatus">Save status</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
