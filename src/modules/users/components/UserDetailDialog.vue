<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import UserDetailPanel from '@/modules/users/components/UserDetailPanel.vue'
import type { User } from '@/types/user'

defineProps<{
  open: boolean
  user: User | null
  canEdit?: boolean
  loading?: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  close: []
  edit: [user: User]
  retry: []
}>()
</script>

<template>
  <AppModal
    :open="open"
    title="User details"
    description="Profile information returned by the API."
    size="lg"
    @close="emit('close')"
  >
    <AppDetailSkeleton v-if="loading" compact />

    <div
      v-else-if="errorMessage"
      class="rounded-lg border border-danger-border bg-danger-soft px-4 py-3"
      role="alert"
    >
      <p class="text-sm font-medium text-danger-fg">Couldn't load user</p>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" @click="emit('retry')">Try again</AppButton>
      </div>
    </div>

    <UserDetailPanel v-else-if="user" :user="user" />

    <template v-if="user && !loading && !errorMessage" #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <AppButton variant="secondary" @click="emit('close')">Close</AppButton>
        <AppButton v-if="canEdit" @click="emit('edit', user)">Edit</AppButton>
      </div>
    </template>
  </AppModal>
</template>
