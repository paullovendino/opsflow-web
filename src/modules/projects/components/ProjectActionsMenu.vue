<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import type { Project } from '@/types/project'

const props = defineProps<{
  project: Project
  canEdit: boolean
  canManageStatus: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  changeStatus: [project: Project]
  remove: [project: Project]
}>()

const open = ref(false)

const itemClass =
  'block w-full px-3 py-2 text-left text-sm text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50 focus-visible:bg-slate-100'
const dangerClass =
  'block w-full px-3 py-2 text-left text-sm text-red-700 outline-none hover:bg-red-50 focus:bg-red-50 focus-visible:bg-red-100'
const linkClass =
  'block px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50 focus-visible:bg-slate-100'

function toggle(): void {
  open.value = !open.value
}

function closeMenu(): void {
  open.value = false
}

function onChangeStatus(): void {
  closeMenu()
  emit('changeStatus', props.project)
}

function onRemove(): void {
  closeMenu()
  emit('remove', props.project)
}
</script>

<template>
  <AppDropdownMenu v-model:open="open" align="end" menu-class="w-44">
    <template #trigger>
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
        :aria-expanded="open"
        :aria-haspopup="true"
        :aria-label="`Actions for ${project.name}`"
        @click.stop="toggle"
      >
        Actions
      </button>
    </template>

    <RouterLink
      :class="linkClass"
      role="menuitem"
      :to="{ name: 'projects.show', params: { id: project.id } }"
      @click="closeMenu"
    >
      View
    </RouterLink>
    <RouterLink
      v-if="canEdit"
      :class="linkClass"
      role="menuitem"
      :to="{ name: 'projects.edit', params: { id: project.id } }"
      @click="closeMenu"
    >
      Edit
    </RouterLink>
    <button
      v-if="canManageStatus"
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onChangeStatus"
    >
      Change status
    </button>
    <button
      v-if="canDelete"
      type="button"
      :class="dangerClass"
      role="menuitem"
      @click="onRemove"
    >
      Delete
    </button>
  </AppDropdownMenu>
</template>
