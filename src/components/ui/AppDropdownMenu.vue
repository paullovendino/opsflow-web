<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    align?: 'start' | 'end'
    menuClass?: string
  }>(),
  {
    align: 'end',
    menuClass: 'w-44',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const coords = ref({ top: 0, left: 0, minWidth: 0 })

const menuStyle = computed(() => ({
  top: `${coords.value.top}px`,
  left: `${coords.value.left}px`,
  minWidth: `${coords.value.minWidth}px`,
}))

function close(): void {
  emit('update:open', false)
}

function updatePosition(): void {
  const trigger = triggerRef.value
  const menu = menuRef.value
  if (!trigger) {
    return
  }

  const rect = trigger.getBoundingClientRect()
  const menuHeight = menu?.offsetHeight ?? 0
  const menuWidth = menu?.offsetWidth ?? Math.max(rect.width, 176)
  const gap = 4
  const viewportPadding = 8

  let top = rect.bottom + gap
  if (top + menuHeight > window.innerHeight - viewportPadding && rect.top > menuHeight + gap) {
    top = rect.top - menuHeight - gap
  }

  let left = props.align === 'end' ? rect.right - menuWidth : rect.left
  left = Math.min(Math.max(viewportPadding, left), window.innerWidth - menuWidth - viewportPadding)

  coords.value = {
    top,
    left,
    minWidth: rect.width,
  }
}

function onDocumentPointerDown(event: MouseEvent): void {
  if (!props.open) {
    return
  }

  const target = event.target as Node
  if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return
  }

  close()
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    triggerRef.value?.querySelector<HTMLElement>('button, [tabindex]')?.focus()
    return
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return
  }

  const items = Array.from(
    menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
  )
  if (items.length === 0) {
    return
  }

  event.preventDefault()
  const activeIndex = items.findIndex((item) => item === document.activeElement)
  const delta = event.key === 'ArrowDown' ? 1 : -1
  const nextIndex =
    activeIndex === -1 ? 0 : (activeIndex + delta + items.length) % items.length
  items[nextIndex]?.focus()
}

function onWindowChange(): void {
  if (props.open) {
    updatePosition()
  }
}

function attachListeners(): void {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
}

function detachListeners(): void {
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      detachListeners()
      return
    }

    attachListeners()
    await nextTick()
    updatePosition()
    await nextTick()
    updatePosition()
    menuRef.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  },
)

onBeforeUnmount(() => {
  detachListeners()
})
</script>

<template>
  <div ref="triggerRef" class="inline-flex">
    <slot name="trigger" :open="open" :close="close" />
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      ref="menuRef"
      role="menu"
      class="fixed z-[60] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
      :class="menuClass"
      :style="menuStyle"
    >
      <slot :close="close" />
    </div>
  </Teleport>
</template>
