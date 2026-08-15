<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToast } from '@/composables/useToast'
import DepartmentForm from '@/modules/organization/components/DepartmentForm.vue'
import * as organizationService from '@/services/organizationService'
import type { Department, DepartmentWritePayload } from '@/types/organization'
import { toApiClientError } from '@/utils/errors'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    department?: Department | null
    /** Called after mutation succeeds; must refresh the list before resolving. */
    afterSave: (department: Department) => Promise<void>
  }>(),
  {
    department: null,
  },
)

const emit = defineEmits<{
  close: []
}>()

const toast = useToast()
const submitting = ref(false)
const formError = ref<string | null>(null)
const serverErrors = ref<Record<string, string[]> | null>(null)
/** Mutation succeeded; only the list refresh remains. */
const refreshPending = ref(false)
const lastSaved = ref<Department | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      formError.value = null
      serverErrors.value = null
      submitting.value = false
      refreshPending.value = false
      lastSaved.value = null
    }
  },
)

function refreshFailureMessage(): string {
  return props.mode === 'create'
    ? 'Department was created, but the list could not be refreshed. Please try again.'
    : 'Department was updated, but the list could not be refreshed. Please try again.'
}

async function onSubmit(payload: DepartmentWritePayload): Promise<void> {
  submitting.value = true
  formError.value = null
  serverErrors.value = null

  try {
    if (!refreshPending.value) {
      lastSaved.value =
        props.mode === 'create'
          ? await organizationService.createDepartment(payload)
          : await organizationService.updateDepartment(props.department!.id, payload)
      refreshPending.value = true
    }

    await props.afterSave(lastSaved.value!)
    refreshPending.value = false
    lastSaved.value = null
  } catch (error) {
    if (refreshPending.value) {
      formError.value = refreshFailureMessage()
      toast.error(formError.value)
      return
    }

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
    formError.value = apiError.message || 'Unable to save department.'
  } finally {
    submitting.value = false
  }
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
    :title="mode === 'create' ? 'Create department' : 'Edit department'"
    :description="
      mode === 'create'
        ? 'Add a department for organizing users and job titles.'
        : 'Update department details.'
    "
    size="md"
    :busy="submitting"
    @close="onClose"
  >
    <DepartmentForm
      :mode="mode"
      :initial="department"
      :submitting="submitting"
      :server-errors="serverErrors"
      :form-error="formError"
      :submit-label="refreshPending ? 'Retry refresh' : undefined"
      @submit="onSubmit"
      @cancel="onClose"
    />
  </AppModal>
</template>
