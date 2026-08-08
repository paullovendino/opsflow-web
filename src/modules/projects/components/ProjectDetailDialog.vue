<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
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
    description="Summary from the project API. Open the workspace for members and tasks."
    size="lg"
    :busy="loading"
    @close="emit('close')"
  >
    <AppDetailSkeleton v-if="loading" compact />

    <div
      v-else-if="errorMessage"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
      role="alert"
    >
      <p class="text-sm font-medium text-red-900">Couldn't load project</p>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" @click="emit('retry')">Try again</AppButton>
      </div>
    </div>

    <div v-else-if="project" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-slate-900">{{ project.name }}</h2>
          <p class="mt-1 text-sm text-slate-600">{{ project.owner?.full_name || '—' }}</p>
        </div>
        <StatusBadge :status="String(project.status)" kind="project" />
      </div>

      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-sm text-slate-500">Description</dt>
          <dd class="mt-1 whitespace-pre-wrap text-sm text-slate-800">
            {{ project.description || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Status</dt>
          <dd class="mt-1 text-sm text-slate-800">{{ humanizeKey(String(project.status)) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Owner email</dt>
          <dd class="mt-1 text-sm text-slate-800">{{ project.owner?.email || '—' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Start</dt>
          <dd class="mt-1 text-sm text-slate-800">
            {{ project.start_date ? formatDate(project.start_date) : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Due</dt>
          <dd class="mt-1 text-sm text-slate-800">
            {{ project.due_date ? formatDate(project.due_date) : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Created</dt>
          <dd class="mt-1 text-sm text-slate-800">{{ formatDateTime(project.created_at) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-slate-500">Updated</dt>
          <dd class="mt-1 text-sm text-slate-800">{{ formatDateTime(project.updated_at) }}</dd>
        </div>
      </dl>
    </div>

    <template v-if="project && !loading && !errorMessage" #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <AppButton variant="secondary" @click="emit('close')">Close</AppButton>
        <RouterLink
          class="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
