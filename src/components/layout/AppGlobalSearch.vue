<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import type { SearchProjectHit, SearchTaskHit, SearchUserHit } from '@/types/search'
import { SEARCH_MIN_QUERY_LENGTH } from '@/types/search'
import { humanizeKey } from '@/utils/format'

type FlatHit =
  | { kind: 'project'; item: SearchProjectHit; index: number }
  | { kind: 'task'; item: SearchTaskHit; index: number }
  | { kind: 'user'; item: SearchUserHit; index: number }

const router = useRouter()
const { roleName } = useAuth()

const canSearchUsers = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const {
  query,
  results,
  isLoading,
  errorMessage,
  hasSearched,
  isOpen,
  isEmpty,
  meetsMinLength,
  open,
  close,
  clear,
} = useGlobalSearch({
  canSearchUsers: () => canSearchUsers.value,
})

const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)

const flatHits = computed<FlatHit[]>(() => {
  const hits: FlatHit[] = []

  for (const item of results.value.projects) {
    hits.push({ kind: 'project', item, index: hits.length })
  }
  for (const item of results.value.tasks) {
    hits.push({ kind: 'task', item, index: hits.length })
  }
  if (canSearchUsers.value) {
    for (const item of results.value.users) {
      hits.push({ kind: 'user', item, index: hits.length })
    }
  }

  return hits
})

const projectHits = computed(() => flatHits.value.filter((hit) => hit.kind === 'project'))
const taskHits = computed(() => flatHits.value.filter((hit) => hit.kind === 'task'))
const userHits = computed(() => flatHits.value.filter((hit) => hit.kind === 'user'))

const showPanel = computed(
  () =>
    isOpen.value &&
    (isLoading.value ||
      hasSearched.value ||
      errorMessage.value != null ||
      (query.value.trim().length > 0 && !meetsMinLength.value)),
)

const showStatusOnly = computed(
  () =>
    Boolean(errorMessage.value) ||
    (query.value.trim().length > 0 && !meetsMinLength.value) ||
    (hasSearched.value && isEmpty.value && !isLoading.value) ||
    (isLoading.value && isEmpty.value),
)

const statusMessage = computed(() => {
  if (errorMessage.value) {
    return errorMessage.value
  }
  if (!meetsMinLength.value && query.value.trim().length > 0) {
    return `Type at least ${SEARCH_MIN_QUERY_LENGTH} characters to search.`
  }
  if (isLoading.value) {
    return 'Searching…'
  }
  if (hasSearched.value && isEmpty.value) {
    return 'No results found.'
  }
  return ''
})

watch(flatHits, () => {
  activeIndex.value = flatHits.value.length > 0 ? 0 : -1
})

function focusInput(): void {
  open()
  void nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

async function navigateTo(hit: FlatHit): Promise<void> {
  close()
  if (hit.kind === 'project') {
    await router.push({ name: 'projects.show', params: { id: hit.item.id } })
    return
  }
  if (hit.kind === 'task') {
    await router.push({ name: 'tasks.show', params: { id: hit.item.id } })
    return
  }
  await router.push({ name: 'users.show', params: { id: hit.item.id } })
}

async function openActiveOrFirst(): Promise<void> {
  const hit = flatHits.value[activeIndex.value] ?? flatHits.value[0]
  if (!hit) {
    return
  }
  await navigateTo(hit)
}

function onInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    inputRef.value?.blur()
    return
  }

  if (event.key === 'ArrowDown') {
    if (!showPanel.value || flatHits.value.length === 0) {
      return
    }
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % flatHits.value.length
    return
  }

  if (event.key === 'ArrowUp') {
    if (!showPanel.value || flatHits.value.length === 0) {
      return
    }
    event.preventDefault()
    activeIndex.value =
      activeIndex.value <= 0 ? flatHits.value.length - 1 : activeIndex.value - 1
    return
  }

  if (event.key === 'Enter') {
    if (!meetsMinLength.value || flatHits.value.length === 0) {
      return
    }
    event.preventDefault()
    void openActiveOrFirst()
  }
}

function onDocumentPointerDown(event: MouseEvent): void {
  if (!isOpen.value) {
    return
  }
  const target = event.target as Node
  if (rootRef.value?.contains(target)) {
    return
  }
  close()
}

function onWindowKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase()
  const typingContext =
    tag === 'input' || tag === 'textarea' || target?.isContentEditable === true

  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !typingContext) {
    event.preventDefault()
    focusInput()
    return
  }

  if ((event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    focusInput()
  }
}

function onClear(): void {
  clear()
  void nextTick(() => inputRef.value?.focus())
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('keydown', onWindowKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<template>
  <div ref="rootRef" class="relative min-w-0 w-full max-w-md" data-test="global-search">
    <label class="sr-only" for="opsflow-global-search">Search projects, tasks, and users</label>
    <div class="relative">
      <span
        class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-400"
        aria-hidden="true"
      >
        ⌕
      </span>
      <input
        id="opsflow-global-search"
        ref="inputRef"
        v-model="query"
        type="search"
        name="global-search"
        autocomplete="off"
        spellcheck="false"
        placeholder="Search…"
        class="h-9 w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="opsflow-global-search-results"
        :aria-expanded="showPanel"
        :aria-activedescendant="
          activeIndex >= 0 ? `opsflow-global-search-option-${activeIndex}` : undefined
        "
        data-test="global-search-input"
        @focus="open"
        @keydown="onInputKeydown"
      />
      <div class="absolute inset-y-0 right-1.5 flex items-center gap-1">
        <span
          v-if="isLoading"
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-r-transparent"
          aria-hidden="true"
          data-test="global-search-spinner"
        />
        <button
          v-if="query.length > 0"
          type="button"
          class="rounded px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          data-test="global-search-clear"
          @click="onClear"
        >
          Clear
        </button>
      </div>
    </div>

    <div
      v-if="showPanel"
      id="opsflow-global-search-results"
      class="absolute right-0 z-[70] mt-1 max-h-[min(24rem,70vh)] w-[min(100vw-2rem,28rem)] overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
      role="listbox"
      :aria-busy="isLoading"
      data-test="global-search-panel"
    >
      <div
        v-if="showStatusOnly"
        class="px-3 py-3 text-sm"
        :class="errorMessage ? 'text-red-700' : 'text-slate-600'"
        role="status"
        data-test="global-search-status"
      >
        {{ statusMessage }}
      </div>

      <template v-else>
        <section v-if="projectHits.length > 0" class="border-b border-slate-100 py-2" data-test="global-search-projects">
          <h2 class="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</h2>
          <ul class="list-none p-0">
            <li
              v-for="hit in projectHits"
              :id="`opsflow-global-search-option-${hit.index}`"
              :key="`project-${hit.item.id}`"
              role="option"
              :aria-selected="activeIndex === hit.index"
              class="cursor-pointer px-3 py-2 hover:bg-slate-50"
              :class="{ 'bg-slate-100': activeIndex === hit.index }"
              data-test="global-search-project-hit"
              @mousedown.prevent="navigateTo(hit)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-900">{{ hit.item.name }}</p>
                  <p class="text-xs text-slate-500">
                    {{ hit.item.progress === null ? 'No tasks' : `${hit.item.progress}%` }}
                  </p>
                </div>
                <StatusBadge :status="String(hit.item.status)" kind="project" />
              </div>
            </li>
          </ul>
        </section>

        <section v-if="taskHits.length > 0" class="border-b border-slate-100 py-2" data-test="global-search-tasks">
          <h2 class="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Tasks</h2>
          <ul class="list-none p-0">
            <li
              v-for="hit in taskHits"
              :id="`opsflow-global-search-option-${hit.index}`"
              :key="`task-${hit.item.id}`"
              role="option"
              :aria-selected="activeIndex === hit.index"
              class="cursor-pointer px-3 py-2 hover:bg-slate-50"
              :class="{ 'bg-slate-100': activeIndex === hit.index }"
              data-test="global-search-task-hit"
              @mousedown.prevent="navigateTo(hit)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-900">{{ hit.item.title }}</p>
                  <p class="truncate text-xs text-slate-500">
                    {{ hit.item.project?.name || 'Task' }}
                    <span v-if="hit.item.is_overdue" class="font-medium text-red-700"> · Overdue</span>
                  </p>
                </div>
                <StatusBadge :status="String(hit.item.status)" kind="task" />
              </div>
            </li>
          </ul>
        </section>

        <section v-if="userHits.length > 0" class="py-2" data-test="global-search-users">
          <h2 class="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Users</h2>
          <ul class="list-none p-0">
            <li
              v-for="hit in userHits"
              :id="`opsflow-global-search-option-${hit.index}`"
              :key="`user-${hit.item.id}`"
              role="option"
              :aria-selected="activeIndex === hit.index"
              class="cursor-pointer px-3 py-2 hover:bg-slate-50"
              :class="{ 'bg-slate-100': activeIndex === hit.index }"
              data-test="global-search-user-hit"
              @mousedown.prevent="navigateTo(hit)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-900">{{ hit.item.full_name }}</p>
                  <p class="truncate text-xs text-slate-500">{{ hit.item.email }}</p>
                </div>
                <span class="shrink-0 text-xs text-slate-500">{{ humanizeKey(String(hit.item.status)) }}</span>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>
