<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import { useToast } from '@/composables/useToast'
import ProjectForm from '@/modules/projects/components/ProjectForm.vue'
import * as projectService from '@/services/projectService'
import type { Project, ProjectWritePayload } from '@/types/project'
import { toApiClientError } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const headingRef = ref<HTMLElement | null>(null)
const project = ref<Project | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const serverErrors = ref<Record<string, string[]> | null>(null)

function projectId(): number {
  return Number(route.params.id)
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    project.value = await projectService.getProject(projectId())
  } catch (error) {
    const apiError = toApiClientError(error)
    loadError.value = apiError.message || 'Unable to load project.'
    project.value = null
  } finally {
    loading.value = false
  }
}

async function onSubmit(payload: ProjectWritePayload): Promise<void> {
  submitting.value = true
  formError.value = null
  serverErrors.value = null
  try {
    const updated = await projectService.updateProject(projectId(), payload)
    project.value = updated
    toast.success('Project updated.')
    await router.push({ name: 'projects.show', params: { id: updated.id } })
  } catch (error) {
    const apiError = toApiClientError(error)
    formError.value = apiError.message || 'Unable to update project.'
    serverErrors.value = apiError.errors
    if (!apiError.errors) {
      toast.error(formError.value)
    }
  } finally {
    submitting.value = false
  }
}

function onCancel(): void {
  void router.push({ name: 'projects.show', params: { id: projectId() } })
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
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        title="Edit project"
        :description="project ? `Update details for ${project.name}.` : 'Update project details.'"
      />
    </div>

    <div
      v-if="loading"
      class="animate-pulse rounded-xl border border-slate-200 bg-white p-6"
      aria-busy="true"
      aria-label="Loading project"
    >
      <div class="h-5 w-40 rounded bg-slate-200" />
      <div class="mt-4 h-10 rounded bg-slate-100" />
      <div class="mt-3 h-24 rounded bg-slate-100" />
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="h-10 rounded bg-slate-100" />
        <div class="h-10 rounded bg-slate-100" />
      </div>
    </div>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-red-900">Couldn't load project</h2>
      <p class="mt-1 text-sm text-red-800">{{ loadError }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <AppButton type="button" variant="secondary" :loading="loading" @click="load">
          Try again
        </AppButton>
        <AppButton type="button" variant="secondary" @click="onCancel">Back</AppButton>
      </div>
    </div>

    <div v-else-if="project" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <ProjectForm
        mode="edit"
        :initial="project"
        :submitting="submitting"
        :form-error="formError"
        :server-errors="serverErrors"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </div>
  </div>
</template>
