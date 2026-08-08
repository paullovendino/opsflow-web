<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToast } from '@/composables/useToast'
import ProjectForm from '@/modules/projects/components/ProjectForm.vue'
import * as projectService from '@/services/projectService'
import type { Project, ProjectWritePayload } from '@/types/project'
import { toApiClientError } from '@/utils/errors'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    project?: Project | null
  }>(),
  {
    project: null,
  },
)

const emit = defineEmits<{
  close: []
  saved: [project: Project]
}>()

const toast = useToast()
const submitting = ref(false)
const formError = ref<string | null>(null)
const serverErrors = ref<Record<string, string[]> | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      formError.value = null
      serverErrors.value = null
      submitting.value = false
    }
  },
)

async function onSubmit(payload: ProjectWritePayload): Promise<void> {
  submitting.value = true
  formError.value = null
  serverErrors.value = null

  try {
    const saved =
      props.mode === 'create'
        ? await projectService.createProject(payload)
        : await projectService.updateProject(props.project!.id, payload)

    toast.success(props.mode === 'create' ? 'Project created.' : 'Project updated.')
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
    formError.value = apiError.message || 'Unable to save project.'
    toast.error(formError.value)
  } finally {
    submitting.value = false
  }
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
    @close="emit('close')"
  >
    <ProjectForm
      :mode="mode"
      :initial="project"
      :submitting="submitting"
      :server-errors="serverErrors"
      :form-error="formError"
      @submit="onSubmit"
      @cancel="emit('close')"
    />
  </AppModal>
</template>
