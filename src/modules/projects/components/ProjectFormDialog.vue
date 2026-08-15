<script setup lang="ts">
import { watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { createMutationAfterSaveController } from '@/composables/useMutationAfterSave'
import { useToast } from '@/composables/useToast'
import ProjectForm from '@/modules/projects/components/ProjectForm.vue'
import * as projectService from '@/services/projectService'
import type { Project, ProjectWritePayload } from '@/types/project'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    project?: Project | null
    afterSave: (project: Project) => Promise<void>
  }>(),
  {
    project: null,
  },
)

const emit = defineEmits<{
  close: []
}>()

const toast = useToast()
const { submitting, formError, serverErrors, refreshPending, reset, run } =
  createMutationAfterSaveController()

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      reset()
    }
  },
)

async function onSubmit(payload: ProjectWritePayload): Promise<void> {
  await run({
    mode: props.mode,
    mutate: () =>
      props.mode === 'create'
        ? projectService.createProject(payload)
        : projectService.updateProject(props.project!.id, payload),
    afterSave: props.afterSave,
    refreshFailureMessage:
      props.mode === 'create'
        ? 'Project was created, but the list could not be updated. Please try again.'
        : 'Project was updated, but the list could not be updated. Please try again.',
    onForbiddenToast: (message) => toast.error(message),
    fallbackErrorMessage: 'Unable to save project.',
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
    :title="mode === 'create' ? 'Create project' : 'Edit project'"
    :description="
      mode === 'create'
        ? 'New projects start in Planning. Change status from the workspace or list.'
        : 'Update project information. Status is changed separately.'
    "
    size="xl"
    :busy="submitting"
    @close="onClose"
  >
    <ProjectForm
      :mode="mode"
      :initial="project"
      :submitting="submitting"
      :server-errors="serverErrors"
      :form-error="formError"
      :submit-label="refreshPending ? 'Retry update' : undefined"
      @submit="onSubmit"
      @cancel="onClose"
    />
  </AppModal>
</template>
