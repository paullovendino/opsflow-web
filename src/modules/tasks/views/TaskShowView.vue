<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import ActivityTimeline from '@/modules/activity/components/ActivityTimeline.vue'
import RemarkThread from '@/modules/remarks/components/RemarkThread.vue'
import TaskDetailPanel from '@/modules/tasks/components/TaskDetailPanel.vue'
import TaskFormDialog from '@/modules/tasks/components/TaskFormDialog.vue'
import * as taskService from '@/services/taskService'
import type { Task } from '@/types/task'
import { toApiClientError } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { roleName } = useAuth()

const headingRef = ref<HTMLElement | null>(null)
const task = ref<Task | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

const canMutate = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const formDialog = reactive({
  open: false,
})

const confirmDelete = reactive({
  open: false,
  loading: false,
})

const activityRefreshKey = ref(0)

function bumpActivity(): void {
  activityRefreshKey.value += 1
}

function taskId(): number {
  return Number(route.params.id)
}

async function load(): Promise<void> {
  isLoading.value = true
  loadError.value = null
  try {
    task.value = await taskService.getTask(taskId())
    loadError.value = null
  } catch (error) {
    const apiError = toApiClientError(error)
    loadError.value = apiError.message || 'Unable to load task.'
    if (!task.value) {
      task.value = null
    }
  } finally {
    isLoading.value = false
  }
}

function goBack(): void {
  void router.push({ name: 'tasks.index' })
}

function openEdit(): void {
  formDialog.open = true
}

function closeForm(): void {
  formDialog.open = false
}

async function afterFormSave(saved: Task): Promise<void> {
  task.value = saved
  formDialog.open = false
  toast.success('Task updated.')
  bumpActivity()
}

function onTaskUpdated(value: Task): void {
  task.value = value
  bumpActivity()
}

function askDelete(): void {
  confirmDelete.open = true
}

function closeDelete(): void {
  if (confirmDelete.loading) return
  confirmDelete.open = false
}

async function runDelete(): Promise<void> {
  if (!task.value) return
  confirmDelete.loading = true
  try {
    await taskService.deleteTask(task.value.id)
    toast.success('Task deleted.')
    await router.push({ name: 'tasks.index' })
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to delete task.')
  } finally {
    confirmDelete.loading = false
  }
}

watch(
  () => route.params.id,
  () => {
    void load()
  },
)

onMounted(async () => {
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        :title="task?.title || 'Task'"
        description="View details, status, and assignment."
      >
        <template #actions>
          <AppButton type="button" variant="secondary" @click="goBack">Back to list</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <AppDetailSkeleton v-if="isLoading && !task" />

    <div
      v-else-if="loadError && !task"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load task</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ loadError }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">
          Try again
        </AppButton>
        <AppButton type="button" variant="secondary" @click="goBack">Back to list</AppButton>
      </div>
    </div>

    <template v-else-if="task">
      <div
        class="rounded-xl border border-border bg-surface p-5 shadow-sm transition-opacity sm:p-6"
        :class="{ 'pointer-events-none opacity-60': isLoading }"
        :aria-busy="isLoading"
      >
        <TaskDetailPanel
          :task="task"
          :can-edit="canMutate"
          :can-assign="canMutate"
          :can-delete="canMutate"
          @edit="openEdit"
          @remove="askDelete"
          @updated="onTaskUpdated"
        />
      </div>

      <RemarkThread
        :source="{ type: 'task', id: task.id }"
        :project-id="task.project?.id ?? null"
        title="Remarks"
        description="Notes and conversation on this task. Type @ to mention teammates."
        @changed="bumpActivity"
      />

      <ActivityTimeline
        :source="{ type: 'task', id: task.id }"
        :refresh-key="activityRefreshKey"
        title="Activity"
        description="Significant changes recorded for this task."
      />
    </template>

    <TaskFormDialog
      :open="formDialog.open"
      mode="edit"
      :task="task"
      :after-save="afterFormSave"
      @close="closeForm"
    />

    <AppConfirmDialog
      :open="confirmDelete.open"
      title="Delete task"
      :description="task ? `Soft-delete ${task.title}?` : undefined"
      confirm-label="Delete"
      variant="danger"
      :loading="confirmDelete.loading"
      @confirm="runDelete"
      @cancel="closeDelete"
    />
  </div>
</template>
