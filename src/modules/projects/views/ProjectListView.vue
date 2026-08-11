<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFilterBar from '@/components/ui/AppFilterBar.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSearch from '@/components/ui/AppSearch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTable from '@/components/ui/AppTable.vue'
import ProjectProgressMeter from '@/components/ui/ProjectProgressMeter.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useProjectList } from '@/composables/useProjectList'
import { useToast } from '@/composables/useToast'
import ProjectActionsMenu from '@/modules/projects/components/ProjectActionsMenu.vue'
import ProjectDetailDialog from '@/modules/projects/components/ProjectDetailDialog.vue'
import ProjectFormDialog from '@/modules/projects/components/ProjectFormDialog.vue'
import ProjectListSkeleton from '@/modules/projects/components/ProjectListSkeleton.vue'
import * as projectService from '@/services/projectService'
import type { Project, ProjectStatus } from '@/types/project'
import { PROJECT_STATUSES } from '@/types/project'
import { toApiClientError } from '@/utils/errors'
import { formatDate, formatDateTime, humanizeKey } from '@/utils/format'

const route = useRoute()
const toast = useToast()
const { roleName } = useAuth()

const {
  projects,
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
} = useProjectList()

const headingRef = ref<HTMLElement | null>(null)

const canMutate = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const statusOptions = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: humanizeKey(status),
}))

const formDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  project: null as Project | null,
})

const detailDialog = reactive({
  open: false,
  project: null as Project | null,
  loading: false,
  errorMessage: null as string | null,
})

const confirmDelete = reactive({
  open: false,
  loading: false,
  project: null as Project | null,
})

const statusDialog = reactive({
  open: false,
  loading: false,
  project: null as Project | null,
  status: 'planning' as ProjectStatus,
})

async function syncRouteToIndex(): Promise<void> {
  if (route.name === 'projects.create' || route.name === 'projects.edit') {
    await syncQuery()
  }
}

function openCreate(): void {
  formDialog.mode = 'create'
  formDialog.project = null
  formDialog.open = true
  if (route.name !== 'projects.create') {
    openModalAlias('projects.create')
  }
}

function openEdit(project: Project): void {
  detailDialog.open = false
  formDialog.mode = 'edit'
  formDialog.project = project
  formDialog.open = true
  if (route.name !== 'projects.edit' || Number(route.params.id) !== project.id) {
    openModalAlias('projects.edit', { id: project.id })
  }
}

async function openView(project: Project): Promise<void> {
  detailDialog.open = true
  detailDialog.project = project
  detailDialog.loading = true
  detailDialog.errorMessage = null
  try {
    detailDialog.project = await projectService.getProject(project.id, { quietProgress: true })
  } catch (error) {
    const apiError = toApiClientError(error)
    detailDialog.errorMessage = apiError.message || 'Unable to load project.'
  } finally {
    detailDialog.loading = false
  }
}

function closeFormDialog(): void {
  formDialog.open = false
  formDialog.project = null
  void syncRouteToIndex()
}

function closeDetailDialog(): void {
  detailDialog.open = false
  detailDialog.project = null
  detailDialog.errorMessage = null
}

async function onSaved(project: Project): Promise<void> {
  formDialog.open = false
  formDialog.project = null
  await syncRouteToIndex()
  await load()
  await openView(project)
}

function askDelete(project: Project): void {
  detailDialog.open = false
  confirmDelete.project = project
  confirmDelete.open = true
}

function closeDelete(): void {
  if (confirmDelete.loading) return
  confirmDelete.open = false
  confirmDelete.project = null
}

async function runDelete(): Promise<void> {
  if (!confirmDelete.project) return
  confirmDelete.loading = true
  try {
    await projectService.deleteProject(confirmDelete.project.id)
    toast.success('Project deleted.')
    confirmDelete.open = false
    confirmDelete.project = null
    await load()
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to delete project.')
  } finally {
    confirmDelete.loading = false
  }
}

function openStatus(project: Project): void {
  statusDialog.project = project
  statusDialog.status = (PROJECT_STATUSES.includes(project.status as ProjectStatus)
    ? project.status
    : 'planning') as ProjectStatus
  statusDialog.open = true
}

function closeStatus(): void {
  if (statusDialog.loading) return
  statusDialog.open = false
  statusDialog.project = null
}

async function saveStatus(): Promise<void> {
  if (!statusDialog.project) return
  statusDialog.loading = true
  try {
    await projectService.updateProjectStatus(statusDialog.project.id, {
      status: statusDialog.status,
    })
    toast.success('Project status updated.')
    statusDialog.open = false
    statusDialog.project = null
    await load()
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to update status.')
  } finally {
    statusDialog.loading = false
  }
}

async function loadEditFromRoute(id: number): Promise<void> {
  formDialog.mode = 'edit'
  formDialog.open = true
  formDialog.project = projects.value.find((item) => item.id === id) ?? null

  try {
    formDialog.project = await projectService.getProject(id, { quietProgress: true })
  } catch (error) {
    const apiError = toApiClientError(error)
    formDialog.open = false
    toast.error(apiError.message || 'Unable to load project for edit.')
    await syncRouteToIndex()
  }
}

watch(
  () => [route.name, route.params.id] as const,
  ([name, id]) => {
    if (name === 'projects.create') {
      formDialog.mode = 'create'
      formDialog.project = null
      formDialog.open = true
      return
    }

    if (name === 'projects.edit') {
      const projectId = Number(id)
      if (Number.isFinite(projectId)) {
        void loadEditFromRoute(projectId)
      }
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
      <AppPageHeader title="Projects" description="Search, filter, and manage projects.">
        <template #actions>
          <AppButton v-if="canMutate" @click="openCreate">Create project</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <AppFilterBar>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <AppSearch
          :model-value="searchInput"
          label="Search"
          placeholder="Search name or description"
          @update:model-value="onSearchInput"
        />
        <AppSelect
          id="filter_project_status"
          :model-value="filters.status || null"
          class="min-w-[10rem] flex-1"
          label="Status"
          :options="statusOptions"
          optional
          placeholder="Any status"
          @update:model-value="
            (value) => {
              filters.status = PROJECT_STATUSES.includes(value as ProjectStatus)
                ? (value as ProjectStatus)
                : ''
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

    <ProjectListSkeleton v-if="isLoading && projects.length === 0" />

    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-red-900">Couldn't load projects</h2>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else>
      <AppEmptyState
        v-if="isEmpty"
        :title="hasActiveFilters ? 'No projects match your filters' : 'No projects yet'"
        :description="
          hasActiveFilters
            ? 'Try adjusting search or filters.'
            : 'Create a project to get started.'
        "
      >
        <template v-if="canMutate && !hasActiveFilters" #action>
          <AppButton @click="openCreate">Create project</AppButton>
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
          <AppTable caption="Projects">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Name</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3">Progress</th>
                <th scope="col" class="px-4 py-3">Owner</th>
                <th scope="col" class="px-4 py-3">Start</th>
                <th scope="col" class="px-4 py-3">Due</th>
                <th scope="col" class="px-4 py-3">Created</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </template>
            <tr v-for="project in projects" :key="project.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">{{ project.name }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="String(project.status)" kind="project" />
              </td>
              <td class="px-4 py-3">
                <ProjectProgressMeter :progress="project.progress" compact />
              </td>
              <td class="px-4 py-3 text-slate-600">{{ project.owner?.full_name || '—' }}</td>
              <td class="px-4 py-3 text-slate-600">
                {{ project.start_date ? formatDate(project.start_date) : '—' }}
              </td>
              <td class="px-4 py-3 text-slate-600">
                {{ project.due_date ? formatDate(project.due_date) : '—' }}
              </td>
              <td class="px-4 py-3 text-slate-600">{{ formatDateTime(project.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <ProjectActionsMenu
                  :project="project"
                  :can-edit="canMutate"
                  :can-manage-status="canMutate"
                  :can-delete="canMutate"
                  @view="openView"
                  @edit="openEdit"
                  @change-status="openStatus"
                  @remove="askDelete"
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
            v-for="project in projects"
            :key="`card-${project.id}`"
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-900">{{ project.name }}</p>
                <p class="truncate text-sm text-slate-600">
                  Owner: {{ project.owner?.full_name || '—' }}
                </p>
              </div>
              <StatusBadge :status="String(project.status)" kind="project" />
            </div>
            <div class="mt-3">
              <ProjectProgressMeter :progress="project.progress" compact />
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt class="text-slate-500">Start</dt>
                <dd class="text-slate-800">
                  {{ project.start_date ? formatDate(project.start_date) : '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Due</dt>
                <dd class="text-slate-800">
                  {{ project.due_date ? formatDate(project.due_date) : '—' }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="text-slate-500">Created</dt>
                <dd class="text-slate-800">{{ formatDateTime(project.created_at) }}</dd>
              </div>
            </dl>
            <div class="mt-3 flex justify-end">
              <ProjectActionsMenu
                :project="project"
                :can-edit="canMutate"
                :can-manage-status="canMutate"
                :can-delete="canMutate"
                @view="openView"
                @edit="openEdit"
                @change-status="openStatus"
                @remove="askDelete"
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

    <ProjectFormDialog
      :open="formDialog.open"
      :mode="formDialog.mode"
      :project="formDialog.project"
      @close="closeFormDialog"
      @saved="onSaved"
    />

    <ProjectDetailDialog
      :open="detailDialog.open"
      :project="detailDialog.project"
      :loading="detailDialog.loading"
      :error-message="detailDialog.errorMessage"
      :can-edit="canMutate"
      @close="closeDetailDialog"
      @edit="openEdit"
      @retry="detailDialog.project ? openView(detailDialog.project) : undefined"
    />

    <AppConfirmDialog
      :open="confirmDelete.open"
      title="Delete project"
      :description="
        confirmDelete.project
          ? `Soft-delete ${confirmDelete.project.name}? This removes it from the directory.`
          : undefined
      "
      confirm-label="Delete"
      variant="danger"
      :loading="confirmDelete.loading"
      @confirm="runDelete"
      @cancel="closeDelete"
    />

    <AppModal
      :open="statusDialog.open"
      title="Change project status"
      description="Updates status only via the existing status endpoint."
      size="md"
      :busy="statusDialog.loading"
      @close="closeStatus"
    >
      <AppSelect
        id="project_status_dialog"
        :model-value="statusDialog.status"
        label="Status"
        :options="statusOptions"
        @update:model-value="
          (value) => {
            if (PROJECT_STATUSES.includes(value as ProjectStatus)) {
              statusDialog.status = value as ProjectStatus
            }
          }
        "
      />
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="statusDialog.loading" @click="closeStatus">
            Cancel
          </AppButton>
          <AppButton :loading="statusDialog.loading" @click="saveStatus">Save status</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
