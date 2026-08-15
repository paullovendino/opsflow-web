<script setup lang="ts">
import { ref } from 'vue'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import type { User } from '@/types/user'

const props = defineProps<{
  user: User
  canEdit: boolean
  canManageStatus: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  view: [user: User]
  edit: [user: User]
  activate: [user: User]
  deactivate: [user: User]
  remove: [user: User]
}>()

const open = ref(false)

const itemClass =
  'block w-full px-3 py-2 text-left text-sm text-fg-secondary outline-none hover:bg-surface-hover focus:bg-muted focus-visible:bg-canvas'
const dangerClass =
  'block w-full px-3 py-2 text-left text-sm text-red-700 outline-none hover:bg-danger-soft focus:bg-danger-soft focus-visible:bg-red-100'

function toggle(): void {
  open.value = !open.value
}

function closeMenu(): void {
  open.value = false
}

function onView(): void {
  closeMenu()
  emit('view', props.user)
}

function onEdit(): void {
  closeMenu()
  emit('edit', props.user)
}

function onActivate(): void {
  closeMenu()
  emit('activate', props.user)
}

function onDeactivate(): void {
  closeMenu()
  emit('deactivate', props.user)
}

function onRemove(): void {
  closeMenu()
  emit('remove', props.user)
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
        :aria-label="`Actions for ${user.full_name}`"
        @click.stop="toggle"
      >
        Actions
      </button>
    </template>

    <button type="button" :class="itemClass" role="menuitem" @click="onView">View</button>
    <button v-if="canEdit" type="button" :class="itemClass" role="menuitem" @click="onEdit">
      Edit
    </button>
    <button
      v-if="canManageStatus && user.status === 'inactive'"
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onActivate"
    >
      Activate
    </button>
    <button
      v-if="canManageStatus && user.status === 'active'"
      type="button"
      :class="itemClass"
      role="menuitem"
      @click="onDeactivate"
    >
      Deactivate
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
