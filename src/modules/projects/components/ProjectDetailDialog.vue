<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import ProjectProgressMeter from '@/components/ui/ProjectProgressMeter.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { Project } from '@/types/project'
import { formatDate, formatDateTime, humanizeKey } from '@/utils/format'

defineProps<{
  open: boolean
  project: Project | null
  loading?: boolean
  errorMessage?: string | null
  canEdit?: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: [project: Project]
  retry: []
}>()
</script>

<template>
  <AppModal
    :open="open"
    title="Project details"
    description="Project summary. Open the workspace for members and tasks."
    size="lg"
    :busy="loading"
    @close="emit('close')"
  >
    <AppDetailSkeleton v-if="loading" compact />

    <div
      v-else-if="errorMessage"
      class="rounded-lg border border-danger-border bg-danger-soft px-4 py-3"
      role="alert"
    >
      <p class="text-sm font-medium text-danger-fg">Couldn't load project</p>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" @click="emit('retry')">Try again</AppButton>
      </div>
    </div>

    <div v-else-if="project" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-fg">{{ project.name }}</h2>
          <p class="mt-1 text-sm text-fg-subtle">{{ project.owner?.full_name || '—' }}</p>
        </div>
        <StatusBadge :status="String(project.status)" kind="project" />
      </div>

      <ProjectProgressMeter :progress="project.progress" compact />

      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-sm text-fg-muted">Description</dt>
          <dd class="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">
            {{ project.description || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-fg-muted">Status</dt>
          <dd class="mt-1 text-sm text-fg-secondary">{{ humanizeKey(String(project.status)) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-fg-muted">Owner email</dt>
          <dd class="mt-1 text-sm text-fg-secondary">{{ project.owner?.email || '—' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-fg-muted">Start</dt>
          <dd class="mt-1 text-sm text-fg-secondary">
            {{ project.start_date ? formatDate(project.start_date) : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-fg-muted">Due</dt>
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
    </div>

    <template v-if="project && !loading && !errorMessage" #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <AppButton variant="secondary" @click="emit('close')">Close</AppButton>
        <RouterLink
          class="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-fg-secondary hover:bg-surface-hover"
          :to="{ name: 'projects.show', params: { id: project.id } }"
          @click="emit('close')"
        >
          Open workspace
        </RouterLink>
        <AppButton v-if="canEdit" @click="emit('edit', project)">Edit</AppButton>
      </div>
    </template>
  </AppModal>
</template>
