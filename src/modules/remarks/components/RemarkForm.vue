<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MentionPicker from '@/modules/remarks/components/MentionPicker.vue'
import type { MentionCandidate, RemarkWritePayload } from '@/types/remark'
import { activeMentionQuery, insertMention } from '@/utils/mentions'

const props = withDefaults(
  defineProps<{
    initialBody?: string
    initialMentionIds?: number[]
    candidates: MentionCandidate[]
    loading?: boolean
    submitLabel?: string
    cancelLabel?: string
    showCancel?: boolean
    disabled?: boolean
  }>(),
  {
    initialBody: '',
    initialMentionIds: () => [],
    loading: false,
    submitLabel: 'Post remark',
    cancelLabel: 'Cancel',
    showCancel: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  submit: [payload: RemarkWritePayload]
  cancel: []
}>()

const body = ref(props.initialBody)
const mentionIds = ref<number[]>([...props.initialMentionIds])
const fieldError = ref<string | null>(null)
const textareaEl = ref<HTMLTextAreaElement | null>(null)
const cursor = ref(0)
const highlightIndex = ref(0)

const mentionQuery = computed(() => activeMentionQuery(body.value, cursor.value))
const pickerOpen = computed(() => mentionQuery.value !== null && !props.disabled && !props.loading)

watch(
  () => props.initialBody,
  (value) => {
    body.value = value
  },
)

watch(
  () => props.initialMentionIds,
  (value) => {
    mentionIds.value = [...value]
  },
)

watch(mentionQuery, () => {
  highlightIndex.value = 0
})

function syncCursorFromEvent(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  cursor.value = target.selectionStart ?? target.value.length
  textareaEl.value = target
}

function onInput(value: string): void {
  body.value = value
  fieldError.value = null
  cursor.value = value.length
  nextTick(() => {
    if (textareaEl.value) {
      cursor.value = textareaEl.value.selectionStart ?? value.length
    }
  })
}

function selectMention(user: MentionCandidate): void {
  const result = insertMention(body.value, cursor.value, user)
  body.value = result.body
  cursor.value = result.cursor

  if (!mentionIds.value.includes(user.id)) {
    mentionIds.value = [...mentionIds.value, user.id]
  }

  nextTick(() => {
    const el = textareaEl.value
    if (!el) return
    el.focus()
    el.setSelectionRange(result.cursor, result.cursor)
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (!pickerOpen.value) return

  const options = document.querySelectorAll('[data-test="mention-option"]')
  const count = options.length
  if (count === 0) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightIndex.value = (highlightIndex.value + 1) % count
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightIndex.value = (highlightIndex.value - 1 + count) % count
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    const matches = Array.from(options)
    const button = matches[highlightIndex.value] as HTMLButtonElement | undefined
    if (button) {
      event.preventDefault()
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    }
  } else if (event.key === 'Escape') {
    cursor.value = body.value.length
  }
}

function submit(): void {
  const trimmed = body.value.trim()
  if (!trimmed) {
    fieldError.value = 'Remark cannot be empty.'
    return
  }

  const activeMentionIds = mentionIds.value.filter((id) => {
    const candidate = props.candidates.find((item) => item.id === id)
    if (!candidate) {
      return true
    }
    return trimmed.includes(`@${candidate.full_name}`)
  })

  emit('submit', {
    body: trimmed,
    mentioned_user_ids: activeMentionIds,
  })
}

function reset(): void {
  body.value = ''
  mentionIds.value = []
  fieldError.value = null
  cursor.value = 0
}

defineExpose({ reset })
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div class="relative">
      <AppTextarea
        id="remark-composer"
        :model-value="body"
        label="Remark"
        :rows="3"
        placeholder="Write a remark. Type @ to mention someone…"
        :error="fieldError"
        :disabled="disabled || loading"
        @update:model-value="onInput"
        @keydown="onKeydown"
        @click="syncCursorFromEvent"
        @keyup="syncCursorFromEvent"
      />
      <MentionPicker
        :open="pickerOpen"
        :query="mentionQuery ?? ''"
        :candidates="candidates"
        :highlighted-index="highlightIndex"
        @select="selectMention"
      />
    </div>

    <p v-if="mentionIds.length > 0" class="text-xs text-fg-muted">
      Mentions:
      <span
        v-for="id in mentionIds"
        :key="id"
        class="mr-1 inline-flex rounded bg-canvas px-1.5 py-0.5 text-fg-secondary"
      >
        {{ candidates.find((candidate) => candidate.id === id)?.full_name || `User #${id}` }}
      </span>
    </p>

    <div class="flex flex-wrap justify-end gap-2">
      <AppButton
        v-if="showCancel"
        type="button"
        variant="secondary"
        :disabled="loading"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </AppButton>
      <AppButton type="submit" :loading="loading" loading-label="Saving…">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>
