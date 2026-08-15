<script setup lang="ts">
import { watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { createMutationAfterSaveController } from '@/composables/useMutationAfterSave'
import { useToast } from '@/composables/useToast'
import UserForm from '@/modules/users/components/UserForm.vue'
import * as userService from '@/services/userService'
import type { User, UserWritePayload } from '@/types/user'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    user?: User | null
    afterSave: (user: User) => Promise<void>
  }>(),
  {
    user: null,
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

async function onSubmit(payload: UserWritePayload): Promise<void> {
  await run({
    mode: props.mode,
    mutate: () =>
      props.mode === 'create'
        ? userService.createUser(payload)
        : userService.updateUser(props.user!.id, payload),
    afterSave: props.afterSave,
    refreshFailureMessage:
      props.mode === 'create'
        ? 'User was created, but the list could not be updated. Please try again.'
        : 'User was updated, but the list could not be updated. Please try again.',
    onForbiddenToast: (message) => toast.error(message),
    fallbackErrorMessage: 'Unable to save user.',
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
    :title="mode === 'create' ? 'Create user' : 'Edit user'"
    :description="
      mode === 'create'
        ? 'Add a new user to the organization.'
        : 'Update user details and access.'
    "
    size="xl"
    :busy="submitting"
    @close="onClose"
  >
    <UserForm
      :mode="mode"
      :initial="user"
      :submitting="submitting"
      :server-errors="serverErrors"
      :form-error="formError"
      :submit-label="refreshPending ? 'Retry update' : undefined"
      @submit="onSubmit"
      @cancel="onClose"
    />
  </AppModal>
</template>
