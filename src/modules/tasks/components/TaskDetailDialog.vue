<script setup lang="ts">
import AppModal from '@/components/ui/AppModal.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import TaskDetailPanel from '@/modules/tasks/components/TaskDetailPanel.vue'
import type { Task } from '@/types/task'

defineProps<{
  open: boolean
  task: Task | null
  loading?: boolean
  errorMessage?: string | null
  canEdit: boolean
  canAssign: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: [task: Task]
  remove: [task: Task]
  updated: [task: Task]
  retry: []
}>()
</script>

<template>
  <AppModal
    :open="open"
    title="Task details"
    description="View status, assignment, and task information."
    size="xl"
    :busy="loading"
    @close="emit('close')"
  >
    <AppDetailSkeleton v-if="loading" compact />
    <div
      v-else-if="errorMessage"
      class="rounded-lg border border-danger-border bg-danger-soft px-4 py-3"
      role="alert"
    >
      <p class="text-sm font-medium text-danger-fg">Couldn't load task</p>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-3 text-sm font-medium text-danger-fg underline"
        @click="emit('retry')"
      >
        Try again
      </button>
    </div>
    <TaskDetailPanel
      v-else-if="task"
      :task="task"
      :can-edit="canEdit"
      :can-assign="canAssign"
      :can-delete="canDelete"
      @edit="emit('edit', $event)"
      @remove="emit('remove', $event)"
      @updated="emit('updated', $event)"
    />
  </AppModal>
</template>
