<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import { useToast } from '@/composables/useToast'
import ProjectForm from '@/modules/projects/components/ProjectForm.vue'
import * as projectService from '@/services/projectService'
import type { ProjectWritePayload } from '@/types/project'
import { toApiClientError } from '@/utils/errors'

const router = useRouter()
const toast = useToast()

const headingRef = ref<HTMLElement | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const serverErrors = ref<Record<string, string[]> | null>(null)

async function onSubmit(payload: ProjectWritePayload): Promise<void> {
  submitting.value = true
  formError.value = null
  serverErrors.value = null
  try {
    const project = await projectService.createProject(payload)
    toast.success('Project created.')
    await router.push({ name: 'projects.show', params: { id: project.id } })
  } catch (error) {
    const apiError = toApiClientError(error)
    formError.value = apiError.message || 'Unable to create project.'
    serverErrors.value = apiError.errors
    if (!apiError.errors) {
      toast.error(formError.value)
    }
  } finally {
    submitting.value = false
  }
}

function onCancel(): void {
  void router.push({ name: 'projects.index' })
}

onMounted(async () => {
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        title="Create project"
        description="New projects start in planning. Change status from the project workspace."
      />
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <ProjectForm
        mode="create"
        :submitting="submitting"
        :form-error="formError"
        :server-errors="serverErrors"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </div>
  </div>
</template>
