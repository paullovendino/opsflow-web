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
  view: [project: Project]
  edit: [project: Project]
  changeStatus: [project: Project]
  remove: [project: Project]
}>()

const open = ref(false)

const itemClass =
  'block w-full px-3 py-2 text-left text-sm text-fg-secondary outline-none hover:bg-surface-hover focus:bg-muted focus-visible:bg-canvas'
const dangerClass =
  'block w-full px-3 py-2 text-left text-sm text-danger-fg outline-none hover:bg-danger-soft focus:bg-danger-soft focus-visible:bg-danger-soft'
const linkClass =
  'block px-3 py-2 text-sm text-fg-secondary outline-none hover:bg-surface-hover focus:bg-muted focus-visible:bg-canvas'

function toggle(): void {
  open.value = !open.value
}

function closeMenu(): void {
  open.value = false
}

function onView(): void {
  closeMenu()
  emit('view', props.project)
}

function onEdit(): void {
  closeMenu()
  emit('edit', props.project)
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
  <AppDropdownMenu v-model:open="open" align="end" menu-class="w-48">
    <template #trigger>
      <button
        type="button"
        class="rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm font-medium text-fg-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-page"
        :aria-expanded="open"
        :aria-haspopup="true"
        :aria-label="`Actions for ${project.name}`"
        @click.stop="toggle"
      >
        Actions
      </button>
    </template>

    <button type="button" :class="itemClass" role="menuitem" @click="onView">View</button>
    <RouterLink
      :class="linkClass"
      role="menuitem"
      :to="{ name: 'projects.show', params: { id: project.id } }"
      @click="closeMenu"
    >
      Open workspace
    </RouterLink>
    <button v-if="canEdit" type="button" :class="itemClass" role="menuitem" @click="onEdit">
      Edit
    </button>
    <button
      v-if="canManageStatus"
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onChangeStatus"
    >
      Change status
    </button>
    <button v-if="canDelete" type="button" :class="dangerClass" role="menuitem" @click="onRemove">
      Delete
    </button>
  </AppDropdownMenu>
</template>
