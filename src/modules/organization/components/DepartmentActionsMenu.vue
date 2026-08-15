<script setup lang="ts">
import { ref } from 'vue'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import type { Department } from '@/types/organization'

const props = defineProps<{
  department: Department
}>()

const emit = defineEmits<{
  edit: [department: Department]
  activate: [department: Department]
  deactivate: [department: Department]
  remove: [department: Department]
}>()

const open = ref(false)

const itemClass =
  'block w-full px-3 py-2 text-left text-sm text-fg-secondary outline-none hover:bg-surface-hover focus:bg-muted focus-visible:bg-canvas'
const dangerClass =
  'block w-full px-3 py-2 text-left text-sm text-danger-fg outline-none hover:bg-danger-soft focus:bg-danger-soft focus-visible:bg-danger-soft'

function toggle(): void {
  open.value = !open.value
}

function closeMenu(): void {
  open.value = false
}

function onEdit(): void {
  closeMenu()
  emit('edit', props.department)
}

function onActivate(): void {
  closeMenu()
  emit('activate', props.department)
}

function onDeactivate(): void {
  closeMenu()
  emit('deactivate', props.department)
}

function onRemove(): void {
  closeMenu()
  emit('remove', props.department)
}
</script>

<template>
  <AppDropdownMenu v-model:open="open" align="end" menu-class="w-44">
    <template #trigger>
      <button
        type="button"
        class="rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm font-medium text-fg-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-page"
        :aria-expanded="open"
        :aria-haspopup="true"
        :aria-label="`Actions for ${department.name}`"
        @click.stop="toggle"
      >
        Actions
      </button>
    </template>

    <button type="button" :class="itemClass" role="menuitem" @click="onEdit">Edit</button>
    <button
      v-if="department.status === 'inactive'"
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onActivate"
    >
      Activate
    </button>
    <button
      v-else
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onDeactivate"
    >
      Deactivate
    </button>
    <button type="button" :class="dangerClass" role="menuitem" @click="onRemove">Delete</button>
  </AppDropdownMenu>
</template>
