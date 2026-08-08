<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useToast } from '@/composables/useToast'
import * as projectService from '@/services/projectService'
import * as userService from '@/services/userService'
import type { ProjectMember } from '@/types/project'
import { toApiClientError } from '@/utils/errors'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  projectId: number
  canManage: boolean
}>()

const toast = useToast()

const members = ref<ProjectMember[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const selectedUserId = ref<number | null>(null)
const candidateOptions = ref<Array<{ value: number; label: string }>>([])
const isLoadingCandidates = ref(false)
const isAdding = ref(false)
const addError = ref<string | null>(null)

const removeConfirm = ref<{
  open: boolean
  loading: boolean
  member: ProjectMember | null
}>({
  open: false,
  loading: false,
  member: null,
})

const memberIds = computed(() => new Set(members.value.map((member) => member.id)))

async function loadMembers(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    members.value = await projectService.listProjectMembers(props.projectId)
    errorMessage.value = null
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value = apiError.message || 'Unable to load members.'
    if (members.value.length === 0) {
      members.value = []
    }
  } finally {
    isLoading.value = false
  }
}

async function loadCandidates(): Promise<void> {
  if (!props.canManage) {
    return
  }

  isLoadingCandidates.value = true
  try {
    const result = await userService.listUsers({
      status: 'active',
      per_page: 100,
      sort: 'first_name',
      direction: 'asc',
    })
    candidateOptions.value = result.users
      .filter((user) => !memberIds.value.has(user.id))
      .map((user) => ({
        value: user.id,
        label: `${user.full_name} (${user.email})`,
      }))
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to load users for member selection.')
    candidateOptions.value = []
  } finally {
    isLoadingCandidates.value = false
  }
}

function onSelectCandidate(value: string | number | null): void {
  selectedUserId.value = typeof value === 'number' ? value : null
  addError.value = null
}

async function onAddMember(): Promise<void> {
  if (selectedUserId.value == null) {
    addError.value = 'Select a user to add.'
    return
  }

  isAdding.value = true
  addError.value = null

  try {
    await projectService.addProjectMember(props.projectId, { user_id: selectedUserId.value })
    toast.success('Member added.')
    selectedUserId.value = null
    await loadMembers()
    await loadCandidates()
  } catch (error) {
    const apiError = toApiClientError(error)
    if (apiError.status === 409) {
      addError.value = apiError.message || 'User is already a member of this project.'
      toast.error(addError.value)
      return
    }
    if (apiError.status === 422) {
      addError.value = apiError.errors?.user_id?.[0] ?? apiError.message
      return
    }
    addError.value = apiError.message || 'Unable to add member.'
    toast.error(addError.value)
  } finally {
    isAdding.value = false
  }
}

function askRemove(member: ProjectMember): void {
  removeConfirm.value = {
    open: true,
    loading: false,
    member,
  }
}

function closeRemove(): void {
  if (removeConfirm.value.loading) {
    return
  }
  removeConfirm.value.open = false
  removeConfirm.value.member = null
}

async function confirmRemove(): Promise<void> {
  const member = removeConfirm.value.member
  if (!member) {
    return
  }

  removeConfirm.value.loading = true
  try {
    await projectService.removeProjectMember(props.projectId, member.id)
    toast.success('Member removed.')
    removeConfirm.value.open = false
    removeConfirm.value.member = null
    await loadMembers()
    await loadCandidates()
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to remove member.')
  } finally {
    removeConfirm.value.loading = false
  }
}

watch(
  () => props.projectId,
  () => {
    void loadMembers().then(loadCandidates)
  },
)

onMounted(() => {
  void loadMembers().then(loadCandidates)
})
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Members</h2>
        <p class="text-sm text-slate-600">
          {{ members.length }} member{{ members.length === 1 ? '' : 's' }}
        </p>
      </div>
    </header>

    <div v-if="canManage" class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
      <AppSelect
        id="add_member_user"
        :model-value="selectedUserId"
        class="min-w-0 flex-1"
        label="Add member"
        :options="candidateOptions"
        :disabled="isLoadingCandidates || isAdding"
        optional
        placeholder="Select an active user"
        :error="addError"
        @update:model-value="onSelectCandidate"
      />
      <AppButton type="button" :loading="isAdding" :disabled="isLoadingCandidates" @click="onAddMember">
        Add
      </AppButton>
    </div>

    <div v-if="isLoading && members.length === 0" class="space-y-2" aria-busy="true">
      <AppSkeleton v-for="index in 3" :key="index" class="h-14 w-full" rounded="lg" />
    </div>

    <div
      v-else-if="errorMessage && members.length === 0"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
      role="alert"
    >
      <p class="text-sm font-medium text-red-900">Couldn't load members</p>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="loadMembers">Try again</AppButton>
      </div>
    </div>

    <AppEmptyState
      v-else-if="members.length === 0"
      title="No members yet"
      description="Add active users to collaborate on this project."
    />

    <ul
      v-else
      class="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 transition-opacity"
      :class="{ 'pointer-events-none opacity-60': isLoading }"
      :aria-busy="isLoading"
      role="list"
    >
      <li
        v-for="member in members"
        :key="member.id"
        class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <p class="truncate font-medium text-slate-900">{{ member.full_name }}</p>
          <p class="truncate text-sm text-slate-600">{{ member.email }}</p>
          <p class="text-xs text-slate-500">
            Joined {{ member.joined_at ? formatDateTime(member.joined_at) : '—' }}
          </p>
        </div>
        <AppButton
          v-if="canManage"
          type="button"
          variant="danger"
          @click="askRemove(member)"
        >
          Remove
        </AppButton>
      </li>
    </ul>

    <AppConfirmDialog
      :open="removeConfirm.open"
      title="Remove member"
      :description="
        removeConfirm.member
          ? `Remove ${removeConfirm.member.full_name} from this project?`
          : undefined
      "
      confirm-label="Remove"
      variant="danger"
      :loading="removeConfirm.loading"
      @confirm="confirmRemove"
      @cancel="closeRemove"
    />
  </section>
</template>
