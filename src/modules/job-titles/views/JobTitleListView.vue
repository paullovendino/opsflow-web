<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import JobTitleList from '@/modules/organization/components/JobTitleList.vue'

const headingRef = ref<HTMLElement | null>(null)
const listRef = ref<InstanceType<typeof JobTitleList> | null>(null)

onMounted(async () => {
  await nextTick()
  headingRef.value?.focus()
})

function openCreate(): void {
  listRef.value?.openCreate()
}
</script>

<template>
  <div class="flex flex-col gap-6" data-test="job-titles-page">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        title="Job Titles"
        description="Manage job titles and their department assignments."
      >
        <template #actions>
          <AppButton data-test="create-job-title" @click="openCreate">Create job title</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <JobTitleList ref="listRef" />
  </div>
</template>
