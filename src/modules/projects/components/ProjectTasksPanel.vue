<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import TaskDetailDialog from '@/modules/tasks/components/TaskDetailDialog.vue'
import TaskFormDialog from '@/modules/tasks/components/TaskFormDialog.vue'
import * as taskService from '@/services/taskService'
import type { Task } from '@/types/task'
import { toApiClientError } from '@/utils/errors'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  projectId: number
}>()

const toast = useToast()
const { roleName } = useAuth()

const tasks = ref<Task[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const canMutate = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

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

const confirmDelete = reactive({
  open: false,
  loading: false,
  task: null as Task | null,
})

async function load(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
    try {
      const result = await taskService.listTasks({
        project_id: props.projectId,
        per_page: 50,
        sort: 'created_at',
        direction: 'desc',
      })
      tasks.value = result.tasks
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load tasks.'
      if (tasks.value.length === 0) {
        tasks.value = []
      }
    } finally {
      isLoading.value = false
    }
  }

function openCreate(): void {
  formDialog.mode = 'create'
  formDialog.task = null
  formDialog.open = true
}

function openEdit(task: Task): void {
  detailDialog.open = false
  formDialog.mode = 'edit'
  formDialog.task = task
  formDialog.open = true
}

async function openView(task: Task): Promise<void> {
  detailDialog.open = true
  detailDialog.task = task
  detailDialog.loading = true
  detailDialog.errorMessage = null
  try {
    detailDialog.task = await taskService.getTask(task.id)
  } catch (error) {
    const apiError = toApiClientError(error)
    detailDialog.errorMessage = apiError.message || 'Unable to load task.'
  } finally {
    detailDialog.loading = false
  }
}

async function onSaved(): Promise<void> {
  formDialog.open = false
  formDialog.task = null
  await load()
}

function askDelete(task: Task): void {
  detailDialog.open = false
  confirmDelete.task = task
  confirmDelete.open = true
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

watch(
  () => props.projectId,
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Tasks</h2>
        <p class="text-sm text-slate-600">
          {{ tasks.length }} task{{ tasks.length === 1 ? '' : 's' }} on this project
        </p>
      </div>
      <AppButton v-if="canMutate" type="button" @click="openCreate">Add task</AppButton>
    </header>

    <div v-if="isLoading && tasks.length === 0" class="space-y-2" aria-busy="true">
      <AppSkeleton v-for="index in 3" :key="index" class="h-14 w-full" rounded="lg" />
    </div>

    <div
      v-else-if="errorMessage && tasks.length === 0"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
      role="alert"
    >
      <p class="text-sm font-medium text-red-900">Couldn't load tasks</p>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">Try again</AppButton>
      </div>
    </div>

    <AppEmptyState
      v-else-if="tasks.length === 0"
      title="No tasks yet"
      description="Add tasks to track work on this project."
    >
      <template v-if="canMutate" #action>
        <AppButton @click="openCreate">Add task</AppButton>
      </template>
    </AppEmptyState>

    <ul
      v-else
      class="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 transition-opacity"
      :class="{ 'pointer-events-none opacity-60': isLoading }"
      :aria-busy="isLoading"
      role="list"
    >
      <li
        v-for="task in tasks"
        :key="task.id"
        class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <button type="button" class="min-w-0 text-left" @click="openView(task)">
          <p class="truncate font-medium text-slate-900">{{ task.title }}</p>
          <p class="truncate text-sm text-slate-600">
            {{ task.assignee?.full_name || 'Unassigned' }}
            · Due {{ task.due_date ? formatDate(task.due_date) : '—' }}
          </p>
        </button>
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :status="String(task.status)" kind="task" />
          <StatusBadge :status="String(task.priority)" kind="priority" />
          <AppButton v-if="canMutate" type="button" variant="secondary" @click="openEdit(task)">
            Edit
          </AppButton>
        </div>
      </li>
    </ul>

    <TaskFormDialog
      :open="formDialog.open"
      :mode="formDialog.mode"
      :task="formDialog.task"
      :locked-project-id="projectId"
      @close="formDialog.open = false"
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
      @close="detailDialog.open = false"
      @edit="openEdit"
      @remove="askDelete"
      @updated="
        (value) => {
          detailDialog.task = value
          void load()
        }
      "
      @retry="detailDialog.task ? openView(detailDialog.task) : undefined"
    />

    <AppConfirmDialog
      :open="confirmDelete.open"
      title="Delete task"
      :description="
        confirmDelete.task ? `Soft-delete ${confirmDelete.task.title}?` : undefined
      "
      confirm-label="Delete"
      variant="danger"
      :loading="confirmDelete.loading"
      @confirm="runDelete"
      @cancel="
        () => {
          if (!confirmDelete.loading) {
            confirmDelete.open = false
            confirmDelete.task = null
          }
        }
      "
    />
  </section>
</template>
