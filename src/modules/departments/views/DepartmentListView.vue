<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import DepartmentList from '@/modules/organization/components/DepartmentList.vue'

const headingRef = ref<HTMLElement | null>(null)
const listRef = ref<InstanceType<typeof DepartmentList> | null>(null)

onMounted(async () => {
  await nextTick()
  headingRef.value?.focus()
})

function openCreate(): void {
  listRef.value?.openCreate()
}
</script>

<template>
  <div class="flex flex-col gap-6" data-test="departments-page">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        title="Departments"
        description="Manage the departments available in your organization."
      >
        <template #actions>
          <AppButton data-test="create-department" @click="openCreate">Create department</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <DepartmentList ref="listRef" />
  </div>
</template>
