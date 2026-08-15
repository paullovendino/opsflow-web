<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  items: Array<{ label: string; value: number }>
}>()

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))

function widthPercent(value: number): string {
  if (total.value <= 0) {
    return '0%'
  }

  return `${Math.max((value / total.value) * 100, value > 0 ? 4 : 0)}%`
}
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-4 shadow-sm">
    <h3 class="text-sm font-semibold text-fg">{{ title }}</h3>
    <ul class="mt-4 flex flex-col gap-3" role="list">
      <li v-for="item in items" :key="item.label" class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="text-fg-subtle">{{ item.label }}</span>
          <span class="font-medium text-fg">{{ item.value }}</span>
        </div>
        <div
          class="h-2 overflow-hidden rounded-full bg-canvas"
          role="img"
          :aria-label="`${item.label}: ${item.value}`"
        >
          <div class="h-full rounded-full bg-fg transition-all" :style="{ width: widthPercent(item.value) }" />
        </div>
      </li>
    </ul>
    <p v-if="total === 0" class="mt-3 text-sm text-fg-muted">No data yet.</p>
  </div>
</template>
