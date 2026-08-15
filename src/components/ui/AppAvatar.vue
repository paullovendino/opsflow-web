<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    avatar?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    avatar: null,
    size: 'md',
  },
)

const imageFailed = ref(false)

const initials = computed(() => {
  const parts = (props.name || 'U').trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? 'U'
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : ''
  return `${first}${last}`.toUpperCase()
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-7 w-7 text-[11px]'
  if (props.size === 'lg') return 'h-14 w-14 text-lg'
  return 'h-10 w-10 text-sm'
})

const showImage = computed(() => {
  if (imageFailed.value) return false
  const value = props.avatar?.trim() ?? ''
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('blob:')
  )
})

watch(
  () => props.avatar,
  () => {
    imageFailed.value = false
  },
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-inverse font-semibold text-on-inverse"
    :class="sizeClass"
    data-test="app-avatar"
    :aria-label="name || 'User avatar'"
  >
    <img
      v-if="showImage"
      :src="avatar!"
      :alt="name"
      class="h-full w-full object-cover"
      data-test="app-avatar-image"
      @error="imageFailed = true"
    />
    <span v-else data-test="app-avatar-initials">{{ initials }}</span>
  </span>
</template>
