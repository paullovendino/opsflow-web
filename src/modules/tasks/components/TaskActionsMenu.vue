<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import type { Task } from '@/types/task'

const props = defineProps<{
  task: Task
  canEdit: boolean
  canDelete: boolean
  canChangeStatus: boolean
}>()

const emit = defineEmits<{
  view: [task: Task]
  edit: [task: Task]
  changeStatus: [task: Task]
  assign: [task: Task]
  remove: [task: Task]
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

function onView(): void {
  closeMenu()
  emit('view', props.task)
}

function onEdit(): void {
  closeMenu()
  emit('edit', props.task)
}

function onChangeStatus(): void {
  closeMenu()
  emit('changeStatus', props.task)
}

function onAssign(): void {
  closeMenu()
  emit('assign', props.task)
}

function onRemove(): void {
  closeMenu()
  emit('remove', props.task)
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
        :aria-label="`Actions for ${task.title}`"
        @click.stop="toggle"
      >
        Actions
      </button>
    </template>

    <button type="button" :class="itemClass" role="menuitem" @click="onView">View</button>
    <RouterLink
      :class="linkClass"
      role="menuitem"
      :to="{ name: 'tasks.show', params: { id: task.id } }"
      @click="closeMenu"
    >
      Open page
    </RouterLink>
    <button v-if="canEdit" type="button" :class="itemClass" role="menuitem" @click="onEdit">
      Edit
    </button>
    <button
      v-if="canChangeStatus"
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onChangeStatus"
    >
      Change status
    </button>
    <button v-if="canEdit" type="button" :class="itemClass" role="menuitem" @click="onAssign">
      Assign
    </button>
    <button v-if="canDelete" type="button" :class="dangerClass" role="menuitem" @click="onRemove">
      Delete
    </button>
  </AppDropdownMenu>
</template>
