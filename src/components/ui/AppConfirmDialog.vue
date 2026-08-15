<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'primary' | 'danger'
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'primary',
    loading: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const previouslyFocused = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape' && !props.loading) {
    event.preventDefault()
    emit('cancel')
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
      dialogRef.value?.querySelector<HTMLElement>('button')?.focus()
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        class="absolute inset-0 bg-overlay"
        aria-hidden="true"
        @click="!loading && emit('cancel')"
      />
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="description ? descriptionId : undefined"
        class="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 :id="titleId" class="text-lg font-semibold text-fg">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="mt-2 text-sm text-fg-subtle">
          {{ description }}
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="loading" @click="emit('cancel')">
            {{ cancelLabel }}
          </AppButton>
          <AppButton :variant="variant" :loading="loading" @click="emit('confirm')">
            {{ confirmLabel }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
