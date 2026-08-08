<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import AppModal from '@/components/ui/AppModal.vue'
import RemarkForm from '@/modules/remarks/components/RemarkForm.vue'
import type { MentionCandidate, Remark, RemarkWritePayload } from '@/types/remark'
import { formatDateTime } from '@/utils/format'
import { segmentRemarkBody } from '@/utils/mentions'

const props = defineProps<{
  remark: Remark
  candidates: MentionCandidate[]
  saving?: boolean
}>()

const emit = defineEmits<{
  edit: [payload: RemarkWritePayload]
  remove: []
}>()

const editOpen = ref(false)
const menuOpen = ref(false)

const bodySegments = computed(() => segmentRemarkBody(props.remark.body, props.remark.mentions))
const showActions = computed(() => props.remark.can_edit || props.remark.can_delete)

const itemClass =
  'block w-full px-3 py-2 text-left text-sm text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50 focus-visible:bg-slate-100'
const dangerClass =
  'block w-full px-3 py-2 text-left text-sm text-red-700 outline-none hover:bg-red-50 focus:bg-red-50 focus-visible:bg-red-100'

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function closeMenu(): void {
  menuOpen.value = false
}

function openEdit(): void {
  closeMenu()
  editOpen.value = true
}

function closeEdit(): void {
  editOpen.value = false
}

function onRemove(): void {
  closeMenu()
  emit('remove')
}

function onSubmit(payload: RemarkWritePayload): void {
  emit('edit', payload)
  editOpen.value = false
}

defineExpose({
  closeEdit,
})
</script>

<template>
  <article class="rounded-lg border border-slate-200 bg-slate-50/60 p-4" data-test="remark-item">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-slate-900">
          {{ remark.author?.full_name || 'Unknown author' }}
        </p>
        <p class="text-xs text-slate-500">
          {{ formatDateTime(remark.created_at) }}
          <span v-if="remark.updated_at !== remark.created_at"> · edited</span>
        </p>
      </div>

      <AppDropdownMenu
        v-if="showActions"
        v-model:open="menuOpen"
        align="end"
        menu-class="w-36"
      >
        <template #trigger>
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
            :aria-expanded="menuOpen"
            :aria-haspopup="true"
            aria-label="Remark actions"
            data-test="remark-actions"
            @click.stop="toggleMenu"
          >
            <span class="text-lg leading-none" aria-hidden="true">⋮</span>
          </button>
        </template>

        <button
          v-if="remark.can_edit"
          type="button"
          :class="itemClass"
          role="menuitem"
          data-test="remark-edit"
          @click="openEdit"
        >
          Edit
        </button>
        <button
          v-if="remark.can_delete"
          type="button"
          :class="dangerClass"
          role="menuitem"
          data-test="remark-delete"
          @click="onRemove"
        >
          Delete
        </button>
      </AppDropdownMenu>
    </header>

    <p class="mt-3 whitespace-pre-wrap break-words text-sm text-slate-800" data-test="remark-body">
      <template v-for="(segment, index) in bodySegments" :key="`${segment.type}-${index}`">
        <span
          v-if="segment.type === 'mention'"
          class="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-medium text-slate-900"
          data-test="remark-mention"
        >{{ segment.value }}</span>
        <template v-else>{{ segment.value }}</template>
      </template>
    </p>

    <AppModal
      :open="editOpen"
      title="Edit remark"
      description="Update the remark text and mentions."
      size="md"
      :busy="saving"
      @close="closeEdit"
    >
      <RemarkForm
        :initial-body="remark.body"
        :initial-mention-ids="remark.mentions.map((mention) => mention.id)"
        :candidates="candidates"
        :loading="saving"
        submit-label="Save changes"
        show-cancel
        @submit="onSubmit"
        @cancel="closeEdit"
      />
    </AppModal>
  </article>
</template>
