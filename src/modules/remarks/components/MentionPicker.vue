<script setup lang="ts">
import { computed } from 'vue'
import type { MentionCandidate } from '@/types/remark'
import { filterMentionCandidates } from '@/utils/mentions'

const props = withDefaults(
  defineProps<{
    open: boolean
    query: string
    candidates: MentionCandidate[]
    highlightedIndex?: number
  }>(),
  {
    highlightedIndex: 0,
  },
)

const emit = defineEmits<{
  select: [user: MentionCandidate]
}>()

const matches = computed(() => filterMentionCandidates(props.candidates, props.query))
</script>

<template>
  <div
    v-if="open && matches.length > 0"
    class="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg"
    role="listbox"
    aria-label="Mention suggestions"
    data-test="mention-picker"
  >
    <button
      v-for="(candidate, index) in matches"
      :key="candidate.id"
      type="button"
      role="option"
      class="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
      :class="{ 'bg-slate-100': index === highlightedIndex }"
      :aria-selected="index === highlightedIndex"
      data-test="mention-option"
      @mousedown.prevent="emit('select', candidate)"
    >
      <span class="font-medium text-slate-900">{{ candidate.full_name }}</span>
      <span class="text-xs text-slate-500">{{ candidate.email }}</span>
    </button>
  </div>
</template>
