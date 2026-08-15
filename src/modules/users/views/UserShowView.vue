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
import UserDetailPanel from '@/modules/users/components/UserDetailPanel.vue'
import UserFormDialog from '@/modules/users/components/UserFormDialog.vue'
import * as userService from '@/services/userService'
import type { User } from '@/types/user'
import { toApiClientError } from '@/utils/errors'

const props = withDefaults(
  defineProps<{
    profileMode?: boolean
  }>(),
  {
    profileMode: false,
  },
)

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { roleName, user: currentUser } = useAuth()

const user = ref<User | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const headingRef = ref<HTMLElement | null>(null)

const canEdit = computed(() => roleName.value === 'administrator' && !props.profileMode)
const canManageStatus = computed(() => roleName.value === 'administrator' && !props.profileMode)
const canDelete = computed(() => roleName.value === 'administrator' && !props.profileMode)
const canViewDirectory = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const confirm = reactive({
  open: false,
  loading: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  variant: 'primary' as 'primary' | 'danger',
  action: null as null | (() => Promise<void>),
})

const formDialog = reactive({
  open: false,
})

function resolveId(): number {
  if (props.profileMode) {
    return currentUser.value?.id ?? 0
  }
  return Number(route.params.id)
}

async function load(): Promise<void> {
  const id = resolveId()
  if (!id) {
    loadError.value = 'User not found.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = null

  try {
    user.value = await userService.getUser(id)
  } catch (error) {
    const apiError = toApiClientError(error)
    loadError.value = apiError.message || 'Unable to load user.'
    if (!user.value) {
      user.value = null
    }
  } finally {
    isLoading.value = false
  }
}

function openConfirm(options: {
  title: string
  description: string
  confirmLabel: string
  variant?: 'primary' | 'danger'
  action: () => Promise<void>
}): void {
  confirm.title = options.title
  confirm.description = options.description
  confirm.confirmLabel = options.confirmLabel
  confirm.variant = options.variant ?? 'primary'
  confirm.action = options.action
  confirm.open = true
}

function closeConfirm(): void {
  if (confirm.loading) return
  confirm.open = false
  confirm.action = null
}

async function runConfirm(): Promise<void> {
  if (!confirm.action) return
  confirm.loading = true
  try {
    await confirm.action()
    confirm.open = false
    confirm.action = null
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Action failed.')
  } finally {
    confirm.loading = false
  }
}

function onActivate(): void {
  if (!user.value) return
  openConfirm({
    title: 'Activate user',
    description: `Activate ${user.value.full_name}?`,
    confirmLabel: 'Activate',
    action: async () => {
      user.value = await userService.updateUserStatus(user.value!.id, { status: 'active' })
      toast.success('User activated.')
    },
  })
}

function onDeactivate(): void {
  if (!user.value) return
  openConfirm({
    title: 'Deactivate user',
    description: `Deactivate ${user.value.full_name}?`,
    confirmLabel: 'Deactivate',
    variant: 'danger',
    action: async () => {
      user.value = await userService.updateUserStatus(user.value!.id, { status: 'inactive' })
      toast.success('User deactivated.')
    },
  })
}

function onRemove(): void {
  if (!user.value) return
  if (currentUser.value?.id === user.value.id) {
    toast.error('You cannot delete your own account.')
    return
  }

  openConfirm({
    title: 'Delete user',
    description: `Soft-delete ${user.value.full_name}?`,
    confirmLabel: 'Delete',
    variant: 'danger',
    action: async () => {
      await userService.deleteUser(user.value!.id)
      toast.success('User deleted.')
      await router.push({ name: 'users.index' })
    },
  })
}

function openEdit(): void {
  formDialog.open = true
}

function closeForm(): void {
  formDialog.open = false
}

function onSaved(saved: User): void {
  formDialog.open = false
  user.value = saved
}

watch(
  () => [route.params.id, props.profileMode, currentUser.value?.id],
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
        :title="profileMode ? 'My profile' : 'User details'"
        :description="profileMode ? 'Your account information.' : 'Full profile returned by the API.'"
      >
        <template #actions>
          <AppButton
            v-if="canViewDirectory && !profileMode"
            variant="secondary"
            @click="router.push({ name: 'users.index' })"
          >
            Back to users
          </AppButton>
          <AppButton v-if="canEdit && user" @click="openEdit">Edit</AppButton>
          <AppButton
            v-if="canManageStatus && user?.status === 'inactive'"
            variant="secondary"
            @click="onActivate"
          >
            Activate
          </AppButton>
          <AppButton
            v-if="canManageStatus && user?.status === 'active'"
            variant="secondary"
            @click="onDeactivate"
          >
            Deactivate
          </AppButton>
          <AppButton v-if="canDelete && user" variant="danger" @click="onRemove">
            Delete
          </AppButton>
        </template>
      </AppPageHeader>
    </div>

    <AppDetailSkeleton v-if="isLoading && !user" />

    <div
      v-else-if="loadError && !user"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load user</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ loadError }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">Try again</AppButton>
      </div>
    </div>

    <template v-else-if="user">
      <section
        class="rounded-xl border border-border bg-surface p-5 shadow-sm transition-opacity"
        :class="{ 'pointer-events-none opacity-60': isLoading }"
        :aria-busy="isLoading"
      >
        <UserDetailPanel :user="user" />
      </section>

      <ActivityTimeline
        :source="{ type: 'user', id: user.id }"
        title="Activity"
        description="Significant changes recorded for this user."
      />
    </template>

    <AppConfirmDialog
      :open="confirm.open"
      :title="confirm.title"
      :description="confirm.description"
      :confirm-label="confirm.confirmLabel"
      :variant="confirm.variant"
      :loading="confirm.loading"
      @confirm="runConfirm"
      @cancel="closeConfirm"
    />

    <UserFormDialog
      :open="formDialog.open"
      mode="edit"
      :user="user"
      @close="closeForm"
      @saved="onSaved"
    />
  </div>
</template>
