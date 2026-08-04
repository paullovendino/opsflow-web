<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useToast } from '@/composables/useToast'
import UserForm from '@/modules/users/components/UserForm.vue'
import * as userService from '@/services/userService'
import type { User, UserWritePayload } from '@/types/user'
import { toApiClientError } from '@/utils/errors'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    user?: User | null
  }>(),
  {
    user: null,
  },
)

const emit = defineEmits<{
  close: []
  saved: [user: User]
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

async function onSubmit(payload: UserWritePayload): Promise<void> {
  submitting.value = true
  formError.value = null
  serverErrors.value = null

  try {
    const saved =
      props.mode === 'create'
        ? await userService.createUser(payload)
        : await userService.updateUser(props.user!.id, payload)

    toast.success(props.mode === 'create' ? 'User created.' : 'User updated.')
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
    formError.value = apiError.message || 'Unable to save user.'
  } finally {
    submitting.value = false
  }
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
    @close="emit('close')"
  >
    <UserForm
      :mode="mode"
      :initial="user"
      :submitting="submitting"
      :server-errors="serverErrors"
      :form-error="formError"
      @submit="onSubmit"
      @cancel="emit('close')"
    />
  </AppModal>
</template>
