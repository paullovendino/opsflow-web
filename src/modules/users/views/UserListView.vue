<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFilterBar from '@/components/ui/AppFilterBar.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSearch from '@/components/ui/AppSearch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTable from '@/components/ui/AppTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useLookups } from '@/composables/useLookups'
import { useToast } from '@/composables/useToast'
import { useUserList } from '@/composables/useUserList'
import UserActionsMenu from '@/modules/users/components/UserActionsMenu.vue'
import UserDetailDialog from '@/modules/users/components/UserDetailDialog.vue'
import UserFormDialog from '@/modules/users/components/UserFormDialog.vue'
import UserListSkeleton from '@/modules/users/components/UserListSkeleton.vue'
import * as userService from '@/services/userService'
import type { User } from '@/types/user'
import { toApiClientError } from '@/utils/errors'
import { formatDateTime, humanizeKey } from '@/utils/format'

const route = useRoute()
const { roleName, user: currentUser } = useAuth()
const toast = useToast()
const { roleOptions, departmentOptions, jobTitleOptions } = useLookups()

const {
  users,
  meta,
  filters,
  searchInput,
  isLoading,
  errorMessage,
  isEmpty,
  hasActiveFilters,
  retry,
  setPage,
    clearFilters,
    onSearchInput,
    onFilterChange,
    load,
    syncQuery,
    openModalAlias,
  } = useUserList()

const headingRef = ref<HTMLElement | null>(null)

const canCreate = computed(() => roleName.value === 'administrator')
const canEdit = computed(() => roleName.value === 'administrator')
const canManageStatus = computed(() => roleName.value === 'administrator')
const canDelete = computed(() => roleName.value === 'administrator')

const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const formDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  user: null as User | null,
})

const detailDialog = reactive({
  open: false,
  user: null as User | null,
  loading: false,
  errorMessage: null as string | null,
})

const confirm = reactive({
  open: false,
  loading: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  variant: 'primary' as 'primary' | 'danger',
  action: null as null | (() => Promise<void>),
})

async function syncRouteToIndex(): Promise<void> {
  if (route.name === 'users.create' || route.name === 'users.edit') {
    await syncQuery()
  }
}

function openCreate(): void {
  formDialog.mode = 'create'
  formDialog.user = null
  formDialog.open = true
  if (route.name !== 'users.create') {
    openModalAlias('users.create')
  }
}

function openEdit(user: User): void {
  detailDialog.open = false
  formDialog.mode = 'edit'
  formDialog.user = user
  formDialog.open = true
  if (route.name !== 'users.edit' || Number(route.params.id) !== user.id) {
    openModalAlias('users.edit', { id: user.id })
  }
}

async function openView(user: User): Promise<void> {
  detailDialog.open = true
  detailDialog.user = user
  detailDialog.loading = true
  detailDialog.errorMessage = null

  try {
    detailDialog.user = await userService.getUser(user.id, { quietProgress: true })
  } catch (error) {
    const apiError = toApiClientError(error)
    detailDialog.errorMessage = apiError.message || 'Unable to load user.'
  } finally {
    detailDialog.loading = false
  }
}

async function closeFormDialog(): Promise<void> {
  formDialog.open = false
  formDialog.user = null
  await syncRouteToIndex()
}

function closeDetailDialog(): void {
  detailDialog.open = false
  detailDialog.user = null
  detailDialog.errorMessage = null
}

async function onFormSaved(user: User): Promise<void> {
  formDialog.open = false
  formDialog.user = null
  await syncRouteToIndex()
  await load()
  await openView(user)
}

async function loadEditFromRoute(id: number): Promise<void> {
  formDialog.mode = 'edit'
  formDialog.open = true
  formDialog.user = users.value.find((item) => item.id === id) ?? null

  try {
    formDialog.user = await userService.getUser(id, { quietProgress: true })
  } catch (error) {
    const apiError = toApiClientError(error)
    formDialog.open = false
    toast.error(apiError.message || 'Unable to load user for editing.')
    await syncRouteToIndex()
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
  if (confirm.loading) {
    return
  }
  confirm.open = false
  confirm.action = null
}

async function runConfirm(): Promise<void> {
  if (!confirm.action) {
    return
  }

  confirm.loading = true
  try {
    await confirm.action()
    confirm.open = false
    confirm.action = null
    closeDetailDialog()
    await load()
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Action failed.')
  } finally {
    confirm.loading = false
  }
}

function onActivate(user: User): void {
  openConfirm({
    title: 'Activate user',
    description: `Activate ${user.full_name}? They will be able to sign in again.`,
    confirmLabel: 'Activate',
    action: async () => {
      await userService.updateUserStatus(user.id, { status: 'active' })
      toast.success('User activated.')
    },
  })
}

function onDeactivate(user: User): void {
  openConfirm({
    title: 'Deactivate user',
    description: `Deactivate ${user.full_name}? They will no longer be able to sign in.`,
    confirmLabel: 'Deactivate',
    variant: 'danger',
    action: async () => {
      await userService.updateUserStatus(user.id, { status: 'inactive' })
      toast.success('User deactivated.')
    },
  })
}

function onRemove(user: User): void {
  if (currentUser.value?.id === user.id) {
    toast.error('You cannot delete your own account.')
    return
  }

  openConfirm({
    title: 'Delete user',
    description: `Soft-delete ${user.full_name}? This removes them from the directory.`,
    confirmLabel: 'Delete',
    variant: 'danger',
    action: async () => {
      await userService.deleteUser(user.id)
      toast.success('User deleted.')
    },
  })
}

watch(
  () => [route.name, route.params.id] as const,
  ([name, id]) => {
    if (name === 'users.create') {
      formDialog.mode = 'create'
      formDialog.user = null
      formDialog.open = true
      return
    }

    if (name === 'users.edit') {
      const userId = Number(id)
      if (Number.isFinite(userId)) {
        void loadEditFromRoute(userId)
      }
      return
    }

    if (name === 'users.index' && formDialog.open && !detailDialog.open) {
      // Keep modal if closed via route only when leaving create/edit.
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader title="Users" description="Manage users and their access.">
        <template #actions>
          <AppButton v-if="canCreate" @click="openCreate">Create user</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <AppFilterBar>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <AppSearch
          :model-value="searchInput"
          label="Search"
          placeholder="Search name or email"
          @update:model-value="onSearchInput"
        />
        <AppSelect
          id="filter_role"
          :model-value="filters.role_id"
          class="min-w-[10rem] flex-1"
          label="Role"
          :options="roleOptions"
          optional
          placeholder="Any role"
          @update:model-value="
            (value) => {
              filters.role_id = typeof value === 'number' ? value : null
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="filter_department"
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
          id="filter_job_title"
          :model-value="filters.job_title_id"
          class="min-w-[10rem] flex-1"
          label="Job title"
          :options="jobTitleOptions"
          optional
          placeholder="Any job title"
          @update:model-value="
            (value) => {
              filters.job_title_id = typeof value === 'number' ? value : null
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="filter_status"
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

    <UserListSkeleton v-if="isLoading && users.length === 0" />

    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load users</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else>
      <AppEmptyState
        v-if="isEmpty"
        :title="hasActiveFilters ? 'No users match your filters' : 'No users yet'"
        :description="
          hasActiveFilters
            ? 'Try adjusting search or filters.'
            : 'Create a user to get started.'
        "
      >
        <template v-if="canCreate && !hasActiveFilters" #action>
          <AppButton @click="openCreate">Create user</AppButton>
        </template>
        <template v-else-if="hasActiveFilters" #action>
          <AppButton variant="secondary" @click="clearFilters">Clear filters</AppButton>
        </template>
      </AppEmptyState>

      <template v-else>
        <div
          class="hidden md:block"
          :class="{ 'pointer-events-none opacity-60': isLoading }"
          :aria-busy="isLoading"
        >
          <AppTable caption="Users">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Name</th>
                <th scope="col" class="px-4 py-3">Email</th>
                <th scope="col" class="px-4 py-3">Role</th>
                <th scope="col" class="px-4 py-3">Department</th>
                <th scope="col" class="px-4 py-3">Job title</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3">Last login</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </template>
            <tr v-for="user in users" :key="user.id" class="hover:bg-surface-hover">
              <td class="px-4 py-3 font-medium text-fg">{{ user.full_name }}</td>
              <td class="px-4 py-3 text-fg-subtle">{{ user.email }}</td>
              <td class="px-4 py-3">
                <AppBadge
                  v-if="user.role"
                  tone="sky"
                  :label="humanizeKey(user.role.name)"
                />
                <span v-else class="text-fg-muted">—</span>
              </td>
              <td class="px-4 py-3 text-fg-subtle">{{ user.department?.name || '—' }}</td>
              <td class="px-4 py-3 text-fg-subtle">{{ user.job_title?.name || '—' }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="String(user.status)" kind="user" />
              </td>
              <td class="px-4 py-3 text-fg-subtle">
                {{ user.last_login_at ? formatDateTime(user.last_login_at) : '—' }}
              </td>
              <td class="px-4 py-3 text-right">
                <UserActionsMenu
                  :user="user"
                  :can-edit="canEdit"
                  :can-manage-status="canManageStatus"
                  :can-delete="canDelete"
                  @view="openView"
                  @edit="openEdit"
                  @activate="onActivate"
                  @deactivate="onDeactivate"
                  @remove="onRemove"
                />
              </td>
            </tr>
          </AppTable>
        </div>

        <ul
          class="flex flex-col gap-3 md:hidden"
          role="list"
          :class="{ 'pointer-events-none opacity-60': isLoading }"
          :aria-busy="isLoading"
        >
          <li
            v-for="user in users"
            :key="`card-${user.id}`"
            class="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-border-strong"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-fg">{{ user.full_name }}</p>
                <p class="truncate text-sm text-fg-subtle">{{ user.email }}</p>
              </div>
              <StatusBadge :status="String(user.status)" kind="user" />
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt class="text-fg-muted">Role</dt>
                <dd class="text-fg-secondary">
                  {{ user.role ? humanizeKey(user.role.name) : '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-fg-muted">Department</dt>
                <dd class="text-fg-secondary">{{ user.department?.name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-fg-muted">Job title</dt>
                <dd class="text-fg-secondary">{{ user.job_title?.name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-fg-muted">Last login</dt>
                <dd class="text-fg-secondary">
                  {{ user.last_login_at ? formatDateTime(user.last_login_at) : '—' }}
                </dd>
              </div>
            </dl>
            <div class="mt-3 flex justify-end">
              <UserActionsMenu
                :user="user"
                :can-edit="canEdit"
                :can-manage-status="canManageStatus"
                :can-delete="canDelete"
                @view="openView"
                @edit="openEdit"
                @activate="onActivate"
                @deactivate="onDeactivate"
                @remove="onRemove"
              />
            </div>
          </li>
        </ul>

        <AppPagination
          v-if="meta"
          class="mt-4"
          :meta="meta"
          :disabled="isLoading"
          @change="setPage"
        />
      </template>
    </template>

    <UserFormDialog
      :open="formDialog.open"
      :mode="formDialog.mode"
      :user="formDialog.user"
      @close="closeFormDialog"
      @saved="onFormSaved"
    />

    <UserDetailDialog
      :open="detailDialog.open"
      :user="detailDialog.user"
      :loading="detailDialog.loading"
      :error-message="detailDialog.errorMessage"
      :can-edit="canEdit"
      @close="closeDetailDialog"
      @edit="openEdit"
      @retry="detailDialog.user && openView(detailDialog.user)"
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
