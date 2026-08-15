<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFilterBar from '@/components/ui/AppFilterBar.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSearch from '@/components/ui/AppSearch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTable from '@/components/ui/AppTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { ensureLookups, useLookups } from '@/composables/useLookups'
import { useToast } from '@/composables/useToast'
import JobTitleActionsMenu from '@/modules/organization/components/JobTitleActionsMenu.vue'
import JobTitleFormDialog from '@/modules/organization/components/JobTitleFormDialog.vue'
import * as organizationService from '@/services/organizationService'
import type { PaginationMeta } from '@/types/api'
import type { JobTitle, OrgEntityStatus } from '@/types/organization'
import { toApiClientError } from '@/utils/errors'

const toast = useToast()
const { departmentOptions } = useLookups()

const jobTitles = ref<JobTitle[]>([])
const meta = ref<PaginationMeta | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const searchInput = ref('')

const filters = reactive({
  q: '',
  status: '' as OrgEntityStatus | '',
  department_id: null as number | null,
  page: 1,
  per_page: 15,
})

const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const formDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  jobTitle: null as JobTitle | null,
})

const confirm = reactive({
  open: false,
  loading: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  variant: 'primary' as 'primary' | 'danger',
  successMessage: '',
  phase: 'mutate' as 'mutate' | 'refresh',
  deletedId: null as number | null,
  mutate: null as null | (() => Promise<void>),
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

const isEmpty = computed(() => !isLoading.value && jobTitles.value.length === 0)
const hasActiveFilters = computed(
  () => Boolean(filters.q || filters.status || filters.department_id != null),
)

async function load(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null

  try {
    const result = await organizationService.listJobTitles({
      q: filters.q || undefined,
      status: filters.status || undefined,
      department_id: filters.department_id,
      page: filters.page,
      per_page: filters.per_page,
    })
    jobTitles.value = result.items
    meta.value = result.meta
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value = apiError.message || 'Unable to load job titles.'
  } finally {
    isLoading.value = false
  }
}

async function refreshList(): Promise<void> {
  isLoading.value = true
  try {
    const result = await organizationService.listJobTitles({
      q: filters.q || undefined,
      status: filters.status || undefined,
      department_id: filters.department_id,
      page: filters.page,
      per_page: filters.per_page,
    })
    jobTitles.value = result.items
    meta.value = result.meta
    errorMessage.value = null
  } catch (error) {
    throw toApiClientError(error)
  } finally {
    isLoading.value = false
  }
}

async function refreshListAfterDelete(deletedId: number): Promise<void> {
  const onlyRow =
    jobTitles.value.length === 1 && jobTitles.value[0]?.id === deletedId && filters.page > 1
  if (onlyRow) {
    filters.page -= 1
  }
  await refreshList()
}

function onSearchInput(value: string): void {
  searchInput.value = value
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    filters.q = value.trim()
    filters.page = 1
    void load()
  }, 300)
}

function onFilterChange(): void {
  filters.page = 1
  void load()
}

function clearFilters(): void {
  searchInput.value = ''
  filters.q = ''
  filters.status = ''
  filters.department_id = null
  filters.page = 1
  void load()
}

function setPage(page: number): void {
  filters.page = page
  void load()
}

function openCreate(): void {
  formDialog.mode = 'create'
  formDialog.jobTitle = null
  formDialog.open = true
}

function openEdit(jobTitle: JobTitle): void {
  formDialog.mode = 'edit'
  formDialog.jobTitle = jobTitle
  formDialog.open = true
}

function closeFormDialog(): void {
  formDialog.open = false
  formDialog.jobTitle = null
}

async function afterFormSave(_jobTitle: JobTitle): Promise<void> {
  await ensureLookups({ force: true })
  await refreshList()
  const message = formDialog.mode === 'create' ? 'Job title created.' : 'Job title updated.'
  closeFormDialog()
  toast.success(message)
}

function openConfirm(options: {
  title: string
  description: string
  confirmLabel: string
  variant?: 'primary' | 'danger'
  successMessage: string
  deletedId?: number | null
  mutate: () => Promise<void>
}): void {
  confirm.title = options.title
  confirm.description = options.description
  confirm.confirmLabel = options.confirmLabel
  confirm.variant = options.variant ?? 'primary'
  confirm.successMessage = options.successMessage
  confirm.phase = 'mutate'
  confirm.deletedId = options.deletedId ?? null
  confirm.mutate = options.mutate
  confirm.open = true
}

function closeConfirm(): void {
  if (confirm.loading) {
    return
  }
  confirm.open = false
  confirm.mutate = null
  confirm.phase = 'mutate'
  confirm.deletedId = null
}

async function runConfirm(): Promise<void> {
  if (!confirm.mutate && confirm.phase === 'mutate') {
    return
  }

  confirm.loading = true
  try {
    if (confirm.phase === 'mutate') {
      await confirm.mutate!()
      confirm.phase = 'refresh'
    }

    await ensureLookups({ force: true })
    if (confirm.deletedId != null) {
      await refreshListAfterDelete(confirm.deletedId)
    } else {
      await refreshList()
    }

    confirm.open = false
    confirm.mutate = null
    const message = confirm.successMessage
    confirm.phase = 'mutate'
    confirm.deletedId = null
    toast.success(message)
  } catch (error) {
    const apiError = toApiClientError(error)
    if (confirm.phase === 'refresh') {
      confirm.description =
        'The change was saved, but the list could not be refreshed. Please try again.'
      confirm.confirmLabel = 'Retry refresh'
      toast.error(confirm.description)
    } else {
      toast.error(apiError.message || 'Action failed.')
    }
  } finally {
    confirm.loading = false
  }
}

function onActivate(jobTitle: JobTitle): void {
  openConfirm({
    title: 'Activate job title',
    description: `Activate ${jobTitle.name}? It will appear in assignment lookups again.`,
    confirmLabel: 'Activate',
    successMessage: 'Job title activated.',
    mutate: async () => {
      await organizationService.updateJobTitleStatus(jobTitle.id, { status: 'active' })
    },
  })
}

function onDeactivate(jobTitle: JobTitle): void {
  openConfirm({
    title: 'Deactivate job title',
    description: `Deactivate ${jobTitle.name}? It will no longer appear in new assignment lookups.`,
    confirmLabel: 'Deactivate',
    variant: 'danger',
    successMessage: 'Job title deactivated.',
    mutate: async () => {
      await organizationService.updateJobTitleStatus(jobTitle.id, { status: 'inactive' })
    },
  })
}

function onRemove(jobTitle: JobTitle): void {
  const users = jobTitle.users_count ?? 0
  const blockedHint =
    users > 0
      ? ` ${users} user(s) are assigned to this title. Reassign them first if deletion fails.`
      : ' Deletion is only allowed when no users are assigned to this job title.'

  openConfirm({
    title: 'Delete job title',
    description: `Delete ${jobTitle.name}?${blockedHint}`,
    confirmLabel: 'Delete',
    variant: 'danger',
    successMessage: 'Job title deleted.',
    deletedId: jobTitle.id,
    mutate: async () => {
      await organizationService.deleteJobTitle(jobTitle.id)
    },
  })
}

onMounted(() => {
  void load()
})

defineExpose({
  openCreate,
})
</script>

<template>
  <div class="flex flex-col gap-4" data-test="job-title-list">
    <AppFilterBar>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <AppSearch
          :model-value="searchInput"
          label="Search"
          placeholder="Search job titles…"
          @update:model-value="onSearchInput"
        />
        <AppSelect
          id="filter_job_title_department"
          :model-value="filters.department_id"
          class="min-w-[10rem] flex-1"
          label="Department"
          :options="departmentOptions"
          optional
          placeholder="Any department"
          @update:model-value="
            (value) => {
              filters.department_id = typeof value === 'number' ? value : null
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="filter_job_title_status"
          :model-value="filters.status || null"
          class="min-w-[10rem] flex-1"
          label="Status"
          :options="statusFilterOptions"
          optional
          placeholder="Any status"
          @update:model-value="
            (value) => {
              filters.status = value === 'active' || value === 'inactive' ? value : ''
              onFilterChange()
            }
          "
        />
        <div class="flex shrink-0 items-end">
          <AppButton
            variant="secondary"
            class="w-full lg:w-auto"
            :disabled="!hasActiveFilters"
            @click="clearFilters"
          >
            Clear
          </AppButton>
        </div>
      </div>
    </AppFilterBar>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load job titles</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" @click="load">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else>
      <AppEmptyState
        v-if="isEmpty"
        :title="hasActiveFilters ? 'No job titles match your filters' : 'No job titles yet'"
        :description="
          hasActiveFilters
            ? 'Try adjusting search or filters.'
            : 'Create a job title to get started.'
        "
      >
        <template v-if="!hasActiveFilters" #action>
          <AppButton @click="openCreate">Create job title</AppButton>
        </template>
        <template v-else #action>
          <AppButton variant="secondary" @click="clearFilters">Clear filters</AppButton>
        </template>
      </AppEmptyState>

      <template v-else>
        <div :class="{ 'pointer-events-none opacity-60': isLoading }" :aria-busy="isLoading">
          <AppTable caption="Job titles">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Job Title</th>
                <th scope="col" class="px-4 py-3">Department</th>
                <th scope="col" class="px-4 py-3">Users</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </template>
            <tr v-for="jobTitle in jobTitles" :key="jobTitle.id" class="hover:bg-surface-hover">
              <td class="px-4 py-3 font-medium text-fg">{{ jobTitle.name }}</td>
              <td class="px-4 py-3 text-fg-subtle">
                {{ jobTitle.department?.name || '—' }}
              </td>
              <td class="px-4 py-3 text-fg-subtle">{{ jobTitle.users_count ?? 0 }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="jobTitle.status" kind="user" />
              </td>
              <td class="px-4 py-3 text-right">
                <JobTitleActionsMenu
                  :job-title="jobTitle"
                  @edit="openEdit"
                  @activate="onActivate"
                  @deactivate="onDeactivate"
                  @remove="onRemove"
                />
              </td>
            </tr>
          </AppTable>
        </div>

        <AppPagination
          v-if="meta"
          class="mt-4"
          :meta="meta"
          :disabled="isLoading"
          @change="setPage"
        />
      </template>
    </template>

    <JobTitleFormDialog
      :open="formDialog.open"
      :mode="formDialog.mode"
      :job-title="formDialog.jobTitle"
      :department-options="departmentOptions"
      :after-save="afterFormSave"
      @close="closeFormDialog"
    />

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
  </div>
</template>
