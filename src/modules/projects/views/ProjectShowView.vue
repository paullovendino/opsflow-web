<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ProjectProgressMeter from '@/components/ui/ProjectProgressMeter.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import ActivityTimeline from '@/modules/activity/components/ActivityTimeline.vue'
import RemarkThread from '@/modules/remarks/components/RemarkThread.vue'
import ProjectMembersPanel from '@/modules/projects/components/ProjectMembersPanel.vue'
import ProjectFormDialog from '@/modules/projects/components/ProjectFormDialog.vue'
import ProjectTasksPanel from '@/modules/projects/components/ProjectTasksPanel.vue'
import * as projectService from '@/services/projectService'
import type { Project, ProjectStatus } from '@/types/project'
import { PROJECT_STATUSES } from '@/types/project'
import { toApiClientError } from '@/utils/errors'
import { formatDate, formatDateTime, humanizeKey } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { roleName } = useAuth()

const headingRef = ref<HTMLElement | null>(null)
const project = ref<Project | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

const canMutate = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const statusOptions = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: humanizeKey(status),
}))

const confirmDelete = reactive({
  open: false,
  loading: false,
})

const formDialog = reactive({
  open: false,
})

const statusDialog = reactive({
  open: false,
  loading: false,
  status: 'planning' as ProjectStatus,
})

const activityRefreshKey = ref(0)

function bumpActivity(): void {
  activityRefreshKey.value += 1
}

async function refreshProjectHeader(): Promise<void> {
  try {
    project.value = await projectService.getProject(projectId(), { quietProgress: true })
  } catch {
    // Keep current project details; list/activity sections handle their own errors.
  }
}

function projectId(): number {
  return Number(route.params.id)
}

async function load(): Promise<void> {
  isLoading.value = true
  loadError.value = null
  try {
    project.value = await projectService.getProject(projectId())
    loadError.value = null
  } catch (error) {
    const apiError = toApiClientError(error)
    loadError.value = apiError.message || 'Unable to load project.'
    if (!project.value) {
      project.value = null
    }
  } finally {
    isLoading.value = false
  }
}

function goBack(): void {
  void router.push({ name: 'projects.index' })
}

function openEdit(): void {
  formDialog.open = true
}

function closeForm(): void {
  formDialog.open = false
}

async function afterFormSave(saved: Project): Promise<void> {
  project.value = saved
  formDialog.open = false
  toast.success('Project updated.')
  bumpActivity()
}

function openStatus(): void {
  if (!project.value) return
  statusDialog.status = (PROJECT_STATUSES.includes(project.value.status as ProjectStatus)
    ? project.value.status
    : 'planning') as ProjectStatus
  statusDialog.open = true
}

function closeStatus(): void {
  if (statusDialog.loading) return
  statusDialog.open = false
}

async function saveStatus(): Promise<void> {
  if (!project.value) return
  statusDialog.loading = true
  try {
    project.value = await projectService.updateProjectStatus(project.value.id, {
      status: statusDialog.status,
    })
    bumpActivity()
    statusDialog.open = false
    toast.success('Project status updated.')
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to update status.')
  } finally {
    statusDialog.loading = false
  }
}

async function onNestedChanged(): Promise<void> {
  bumpActivity()
  await refreshProjectHeader()
}

function askDelete(): void {
  confirmDelete.open = true
}

function closeDelete(): void {
  if (confirmDelete.loading) return
  confirmDelete.open = false
}

async function runDelete(): Promise<void> {
  if (!project.value) return
  confirmDelete.loading = true
  try {
    await projectService.deleteProject(project.value.id)
    toast.success('Project deleted.')
    confirmDelete.open = false
    await router.push({ name: 'projects.index' })
  } catch (error) {
    const apiError = toApiClientError(error)
    toast.error(apiError.message || 'Unable to delete project.')
  } finally {
    confirmDelete.loading = false
  }
}

watch(
  () => route.params.id,
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
  <div class="flex flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        :title="project?.name || 'Project'"
        description="Project details, members, and related work."
      >
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <AppButton type="button" variant="secondary" @click="goBack">Back to list</AppButton>
            <template v-if="project && canMutate">
              <AppButton type="button" variant="secondary" @click="openStatus">Change status</AppButton>
              <AppButton type="button" variant="secondary" @click="openEdit">Edit</AppButton>
              <AppButton type="button" variant="danger" @click="askDelete">Delete</AppButton>
            </template>
          </div>
        </template>
      </AppPageHeader>
    </div>

    <div v-if="isLoading && !project" class="space-y-4" aria-busy="true" aria-label="Loading project">
      <AppDetailSkeleton />
      <AppDetailSkeleton compact />
    </div>

    <div
      v-else-if="loadError && !project"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load project</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ loadError }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">
          Try again
        </AppButton>
        <AppButton type="button" variant="secondary" @click="goBack">Back to list</AppButton>
      </div>
    </div>

    <template v-else-if="project">
      <div class="flex flex-col gap-6 transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :aria-busy="isLoading">
      <section class="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-fg">Project information</h2>
            <p class="mt-1 text-sm text-fg-subtle">Core project details and progress.</p>
          </div>
          <StatusBadge :status="String(project.status)" kind="project" />
        </header>

        <div class="mt-5 max-w-md">
          <ProjectProgressMeter :progress="project.progress" />
        </div>

        <dl class="mt-5 grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <dt class="text-sm text-fg-muted">Description</dt>
            <dd class="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">
              {{ project.description || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-fg-muted">Owner</dt>
            <dd class="mt-1 text-sm text-fg-secondary">
              {{ project.owner?.full_name || '—' }}
              <span v-if="project.owner?.email" class="block text-fg-muted">
                {{ project.owner.email }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-sm text-fg-muted">Status</dt>
            <dd class="mt-1 text-sm text-fg-secondary">{{ humanizeKey(String(project.status)) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-fg-muted">Start date</dt>
            <dd class="mt-1 text-sm text-fg-secondary">
              {{ project.start_date ? formatDate(project.start_date) : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-fg-muted">Due date</dt>
            <dd class="mt-1 text-sm text-fg-secondary">
              {{ project.due_date ? formatDate(project.due_date) : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-fg-muted">Created</dt>
            <dd class="mt-1 text-sm text-fg-secondary">{{ formatDateTime(project.created_at) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-fg-muted">Updated</dt>
            <dd class="mt-1 text-sm text-fg-secondary">{{ formatDateTime(project.updated_at) }}</dd>
          </div>
        </dl>
      </section>

      <ProjectMembersPanel
        :project-id="project.id"
        :can-manage="canMutate"
        @changed="onNestedChanged"
      />

      <ProjectTasksPanel :project-id="project.id" @changed="onNestedChanged" />

      <RemarkThread
        :source="{ type: 'project', id: project.id }"
        :project-id="project.id"
        title="Remarks"
        description="Notes and conversation on this project. Type @ to mention teammates."
        @changed="bumpActivity"
      />

      <ActivityTimeline
        :source="{ type: 'project', id: project.id }"
        :refresh-key="activityRefreshKey"
        title="Activity"
        description="Significant changes recorded for this project."
      />
      </div>
    </template>

    <AppConfirmDialog
      :open="confirmDelete.open"
      title="Delete project"
      :description="
        project ? `Soft-delete ${project.name}? This removes it from the directory.` : undefined
      "
      confirm-label="Delete"
      variant="danger"
      :loading="confirmDelete.loading"
      @confirm="runDelete"
      @cancel="closeDelete"
    />

    <ProjectFormDialog
      :open="formDialog.open"
      mode="edit"
      :project="project"
      :after-save="afterFormSave"
      @close="closeForm"
    />

    <AppModal
      :open="statusDialog.open"
      title="Change project status"
      description="Choose a new status for this project."
      size="md"
      :busy="statusDialog.loading"
      @close="closeStatus"
    >
      <AppSelect
        id="project_show_status"
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
