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
  afterSave: (task: Task) => Promise<void>
}>()

const emit = defineEmits<{
  close: []
}>()

const toast = useToast()
const saving = ref(false)
const selectedAssignee = ref<number | null>(null)
const assigneeOptions = ref<Array<{ value: number; label: string }>>([])
const assigneesLoading = ref(false)
const formError = ref<string | null>(null)
const refreshPending = ref(false)
const lastSaved = ref<Task | null>(null)

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
    refreshPending.value = false
    lastSaved.value = null
    selectedAssignee.value = props.task.assignee?.id ?? null
    void loadAssignees(props.task.project?.id ?? null)
  },
)

async function save(): Promise<void> {
  if (!props.task) return
  saving.value = true
  formError.value = null
  try {
    if (!refreshPending.value) {
      lastSaved.value = await taskService.updateTaskAssignment(props.task.id, {
        assigned_to: selectedAssignee.value,
      })
      refreshPending.value = true
    }
    await props.afterSave(lastSaved.value!)
    refreshPending.value = false
    lastSaved.value = null
  } catch (error) {
    if (refreshPending.value) {
      formError.value =
        'Assignment was updated, but the list could not be updated. Please try again.'
      toast.error(formError.value)
      return
    }
    const apiError = toApiClientError(error)
    formError.value = apiError.message || 'Unable to update assignment.'
    toast.error(formError.value)
  } finally {
    saving.value = false
  }
}

function onClose(): void {
  if (saving.value) return
  emit('close')
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
    @close="onClose"
  >
    <p
      v-if="formError"
      class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg"
      role="alert"
    >
      {{ formError }}
    </p>
    <AppSelect
      id="task_assignee"
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
        <AppButton variant="secondary" :disabled="saving" @click="onClose">Cancel</AppButton>
        <AppButton :loading="saving" @click="save">
          {{ refreshPending ? 'Retry update' : 'Save assignment' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
