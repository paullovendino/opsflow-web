<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: 'md' | 'lg' | 'xl'
    busy?: boolean
    dismissible?: boolean
  }>(),
  {
    size: 'lg',
    busy: false,
    dismissible: true,
  },
)

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const previouslyFocused = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()

const sizeClass: Record<string, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

function requestClose(): void {
  if (props.busy || !props.dismissible) {
    return
  }
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    requestClose()
    return
  }

  if (event.key !== 'Tab' || !dialogRef.value) {
    return
  }

  const focusable = Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )

  if (focusable.length === 0) {
    return
  }

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused.value = document.activeElement as HTMLElement | null
      document.body.classList.add('overflow-hidden')
      await nextTick()
      const focusTarget =
        dialogRef.value?.querySelector<HTMLElement>('[data-modal-autofocus]') ??
        dialogRef.value?.querySelector<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), button:not([disabled])',
        )
      focusTarget?.focus()
      return
    }

    document.body.classList.remove('overflow-hidden')
    previouslyFocused.value?.focus?.()
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <div class="absolute inset-0 bg-overlay" aria-hidden="true" @click="requestClose" />
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        class="relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-xl border border-border bg-surface shadow-lg sm:rounded-xl"
        :class="sizeClass[size]"
      >
        <header class="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div class="min-w-0">
            <h2 :id="titleId" class="text-lg font-semibold text-fg">{{ title }}</h2>
            <p v-if="description" :id="descriptionId" class="mt-1 text-sm text-fg-subtle">
              {{ description }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
            :disabled="busy || !dismissible"
            @click="requestClose"
          >
            <span aria-hidden="true" class="text-lg leading-none">×</span>
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="border-t border-border px-5 py-4">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
