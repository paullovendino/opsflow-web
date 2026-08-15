<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import { useTheme } from '@/composables/useTheme'
import { THEME_PREFERENCE_OPTIONS, type ThemePreference } from '@/types/profile'

const { themePreference, setPreference } = useTheme()
const open = ref(false)

const MENU_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const preferenceLabel = computed(() => {
  const match = THEME_PREFERENCE_OPTIONS.find((option) => option.value === themePreference.value)
  return match?.label ?? 'System'
})

const ariaLabel = computed(() => `Theme: ${preferenceLabel.value}`)
const titleText = computed(() => `Theme: ${preferenceLabel.value}`)

const itemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-secondary outline-none hover:bg-surface-hover focus:bg-muted focus-visible:bg-canvas'

function toggle(): void {
  open.value = !open.value
}

function closeMenu(): void {
  open.value = false
}

async function selectPreference(value: ThemePreference): Promise<void> {
  closeMenu()
  if (value === themePreference.value) return
  await setPreference(value)
}
</script>

<template>
  <AppDropdownMenu v-model:open="open" align="end" menu-class="w-44">
    <template #trigger>
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-page"
        :aria-expanded="open"
        aria-haspopup="true"
        :aria-label="ariaLabel"
        :title="titleText"
        data-test="theme-toggle"
        @click.stop="toggle"
      >
        <svg
          v-if="themePreference === 'light'"
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          data-test="theme-icon-sun"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
        <svg
          v-else-if="themePreference === 'dark'"
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          data-test="theme-icon-moon"
        >
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
        </svg>
        <svg
          v-else
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          data-test="theme-icon-system"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      </button>
    </template>

    <button
      v-for="option in MENU_OPTIONS"
      :key="option.value"
      type="button"
      role="menuitem"
      :class="itemClass"
      :aria-checked="themePreference === option.value"
      :data-test="`theme-option-${option.value}`"
      @click="selectPreference(option.value)"
    >
      <svg
        v-if="option.value === 'system'"
        class="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
      <svg
        v-else-if="option.value === 'light'"
        class="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        />
      </svg>
      <svg
        v-else
        class="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
      </svg>

      <span class="min-w-0 flex-1">{{ option.label }}</span>
      <span
        v-if="themePreference === option.value"
        class="text-fg"
        aria-hidden="true"
        data-test="theme-option-selected"
      >
        ✓
      </span>
    </button>
  </AppDropdownMenu>
</template>
