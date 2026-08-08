<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useToast } from '@/composables/useToast'
import * as projectService from '@/services/projectService'
import * as taskService from '@/services/taskService'
import type { Task } from '@/types/task'
import { toApiClientError } from '@/utils/errors'

const props = defineProps<{
  open: boolean
  task: Task | null
}>()

const emit = defineEmits<{
  close: []
  saved: [task: Task]
}>()

const toast = useToast()
const saving = ref(false)
const selectedAssignee = ref<number | null>(null)
const assigneeOptions = ref<Array<{ value: number; label: string }>>([])
const assigneesLoading = ref(false)
const formError = ref<string | null>(null)

async function loadAssignees(projectId: number | null): Promise<void> {
  if (projectId == null) {
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
    if (!isOpen || !props.task) return
    formError.value = null
    selectedAssignee.value = props.task.assignee?.id ?? null
    void loadAssignees(props.task.project?.id ?? null)
  },
)

async function save(): Promise<void> {
  if (!props.task) return
  saving.value = true
  formError.value = null
  try {
    const updated = await taskService.updateTaskAssignment(props.task.id, {
      assigned_to: selectedAssignee.value,
    })
    toast.success('Task assignment updated.')
    emit('saved', updated)
  } catch (error) {
    const apiError = toApiClientError(error)
    formError.value = apiError.message || 'Unable to update assignment.'
    toast.error(formError.value)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.open && props.task) {
    selectedAssignee.value = props.task.assignee?.id ?? null
    void loadAssignees(props.task.project?.id ?? null)
  }
})
</script>

<template>
  <AppModal
    :open="open"
    title="Assign task"
    description="Assign an active project owner or member, or clear the assignee."
    size="md"
    :busy="saving"
    @close="emit('close')"
  >
    <p
      v-if="formError"
      class="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {{ formError }}
    </p>
    <p v-if="task" class="mb-3 text-sm text-slate-600">
      Task: <span class="font-medium text-slate-900">{{ task.title }}</span>
    </p>
    <AppSelect
      id="task_assign_dialog"
      :model-value="selectedAssignee"
      label="Assignee"
      :options="assigneeOptions"
      :disabled="assigneesLoading || saving"
      optional
      placeholder="Unassigned"
      @update:model-value="
        (value) => {
          selectedAssignee = typeof value === 'number' ? value : null
        }
      "
    />
    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="secondary" :disabled="saving" @click="emit('close')">Cancel</AppButton>
        <AppButton :loading="saving" :disabled="assigneesLoading" @click="save">
          Save assignment
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
