<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useAuth } from '@/composables/useAuth'
import { useRemarkThread } from '@/composables/useRemarkThread'
import { useToast } from '@/composables/useToast'
import RemarkForm from '@/modules/remarks/components/RemarkForm.vue'
import RemarkItem from '@/modules/remarks/components/RemarkItem.vue'
import * as projectService from '@/services/projectService'
import * as userService from '@/services/userService'
import type { MentionCandidate, Remark, RemarkSource, RemarkWritePayload } from '@/types/remark'
import { toApiClientError } from '@/utils/errors'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'

const props = withDefaults(
  defineProps<{
    source: RemarkSource
    projectId?: number | null
    title?: string
    description?: string
    perPage?: number
  }>(),
  {
    projectId: null,
    title: 'Remarks',
    description: 'Conversation on this record. Mentions notify teammates in a later release.',
    perPage: 15,
  },
)

const toast = useToast()
const { roleName } = useAuth()

const sourceRef = computed(() => props.source)
const {
  remarks,
  meta,
  isLoading,
  errorMessage,
  isEmpty,
  isSaving,
  isDeleting,
  load,
  retry,
  setPage,
  create,
  update,
  remove,
} = useRemarkThread(sourceRef, {
  quiet: true,
  perPage: props.perPage,
})

const candidates = ref<MentionCandidate[]>([])
const candidatesError = ref<string | null>(null)
const formRef = ref<{ reset: () => void } | null>(null)
const editingRemarkId = ref<number | null>(null)

const confirmDelete = reactive<{
  open: boolean
  loading: boolean
  remark: Remark | null
}>({
  open: false,
  loading: false,
  remark: null,
})

const showSkeleton = computed(() => isInitialListLoading(isLoading.value, remarks.value.length))
const softRefresh = computed(() => isSoftListRefresh(isLoading.value, remarks.value.length))
const canSearchUsers = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

async function loadCandidates(): Promise<void> {
  candidatesError.value = null
  const map = new Map<number, MentionCandidate>()

  const resolvedProjectId =
    props.projectId ?? (props.source.type === 'project' ? props.source.id : null)

  try {
    if (resolvedProjectId) {
      const [project, members] = await Promise.all([
        projectService.getProject(resolvedProjectId, { quietProgress: true }),
        projectService.listProjectMembers(resolvedProjectId, { quietProgress: true }),
      ])

      if (project.owner) {
        map.set(project.owner.id, {
          id: project.owner.id,
          full_name: project.owner.full_name,
          email: project.owner.email,
        })
      }

      for (const member of members) {
        if (member.status === 'active' || !member.status) {
          map.set(member.id, {
            id: member.id,
            full_name: member.full_name,
            email: member.email,
          })
        }
      }
    }

    if (canSearchUsers.value) {
      const result = await userService.listUsers(
        {
          status: 'active',
          per_page: 50,
          sort: 'first_name',
          direction: 'asc',
        },
        { quietProgress: true },
      )
      for (const user of result.users) {
        map.set(user.id, {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
        })
      }
    }

    candidates.value = Array.from(map.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name),
    )
  } catch (error) {
    const apiError = toApiClientError(error)
    candidatesError.value = apiError.message || 'Unable to load mention candidates.'
  }
}

async function onCreate(payload: RemarkWritePayload): Promise<void> {
  try {
    await create(payload)
    formRef.value?.reset()
    toast.success('Remark posted.')
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to post remark.')
  }
}

async function onEdit(remark: Remark, payload: RemarkWritePayload): Promise<void> {
  editingRemarkId.value = remark.id
  try {
    await update(remark.id, payload)
    toast.success('Remark updated.')
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to update remark.')
  } finally {
    editingRemarkId.value = null
  }
}

function askDelete(remark: Remark): void {
  confirmDelete.remark = remark
  confirmDelete.open = true
}

function closeDelete(): void {
  if (confirmDelete.loading) return
  confirmDelete.open = false
  confirmDelete.remark = null
}

async function runDelete(): Promise<void> {
  if (!confirmDelete.remark) return
  confirmDelete.loading = true
  try {
    await remove(confirmDelete.remark.id)
    toast.success('Remark deleted.')
    confirmDelete.open = false
    confirmDelete.remark = null
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to delete remark.')
  } finally {
    confirmDelete.loading = false
  }
}

watch(
  () => [props.source.type, props.source.id, props.projectId] as const,
  () => {
    void load()
    void loadCandidates()
  },
  { immediate: true },
)
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-test="remark-thread">
    <header class="mb-4">
      <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-sm text-slate-600">{{ description }}</p>
    </header>

    <div v-if="showSkeleton" class="space-y-4" aria-busy="true" aria-label="Loading remarks">
      <div v-for="index in 3" :key="index" class="space-y-2 rounded-lg border border-slate-100 p-4">
        <AppSkeleton class="h-4 w-1/3" />
        <AppSkeleton class="h-3 w-1/4" />
        <AppSkeleton class="h-16 w-full" />
      </div>
    </div>

    <div
      v-else-if="errorMessage && remarks.length === 0"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-4"
      role="alert"
    >
      <p class="text-sm font-medium text-red-900">Couldn't load remarks</p>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else>
      <p
        v-if="errorMessage"
        class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        role="status"
      >
        Couldn't refresh remarks.
        <button type="button" class="ml-1 font-medium underline" @click="retry">Retry</button>
      </p>

      <AppEmptyState
        v-if="isEmpty"
        title="No remarks yet"
        description="Start the conversation with a short note. Use @ to mention teammates."
      />

      <div
        v-else
        class="mb-5 space-y-3 transition-opacity"
        :class="{ 'opacity-60': softRefresh }"
        :aria-busy="isLoading"
      >
        <RemarkItem
          v-for="remark in remarks"
          :key="remark.id"
          :remark="remark"
          :candidates="candidates"
          :saving="isSaving && editingRemarkId === remark.id"
          @edit="(payload) => onEdit(remark, payload)"
          @remove="askDelete(remark)"
        />
      </div>

      <div v-if="meta && meta.last_page > 1" class="mb-5">
        <AppPagination :meta="meta" :disabled="isLoading" @change="setPage" />
      </div>

      <div class="border-t border-slate-100 pt-4">
        <p v-if="candidatesError" class="mb-2 text-xs text-amber-700">
          Mention suggestions may be limited: {{ candidatesError }}
        </p>
        <RemarkForm
          ref="formRef"
          :candidates="candidates"
          :loading="isSaving && editingRemarkId === null"
          @submit="onCreate"
        />
      </div>
    </template>

    <AppConfirmDialog
      :open="confirmDelete.open"
      title="Delete remark"
      :description="
        confirmDelete.remark
          ? 'Soft-delete this remark? It will disappear from the conversation.'
          : undefined
      "
      confirm-label="Delete"
      variant="danger"
      :loading="confirmDelete.loading || isDeleting"
      @confirm="runDelete"
      @cancel="closeDelete"
    />
  </section>
</template>
