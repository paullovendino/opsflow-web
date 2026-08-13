<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { fullName, email, user, logout, isLoading } = useAuth()
const open = ref(false)

const itemClass =
  'block w-full px-3 py-2 text-left text-sm text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50 focus-visible:bg-slate-100'

function toggle(): void {
  open.value = !open.value
}

function closeMenu(): void {
  open.value = false
}

async function onLogout(): Promise<void> {
  closeMenu()
  await logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <AppDropdownMenu v-model:open="open" align="end" menu-class="w-52">
    <template #trigger>
      <button
        type="button"
        class="inline-flex max-w-[12rem] items-center gap-2 rounded-md border border-slate-300 bg-white py-1 pl-1 pr-2 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 sm:max-w-xs"
        :aria-expanded="open"
        aria-haspopup="true"
        aria-label="Account menu"
        data-test="account-menu"
        @click.stop="toggle"
      >
        <AppAvatar :name="fullName || 'User'" :avatar="user?.avatar" size="sm" />
        <span class="hidden min-w-0 sm:block">
          <span class="block truncate text-sm font-medium text-slate-900">{{ fullName || 'User' }}</span>
          <span class="block truncate text-xs text-slate-500">{{ email }}</span>
        </span>
      </button>
    </template>

    <div class="border-b border-slate-100 px-3 py-2 sm:hidden">
      <p class="truncate text-sm font-medium text-slate-900">{{ fullName || 'User' }}</p>
      <p class="truncate text-xs text-slate-500">{{ email }}</p>
    </div>

    <RouterLink
      :to="{ name: 'profile' }"
      :class="itemClass"
      role="menuitem"
      data-test="account-profile"
      @click="closeMenu"
    >
      Profile
    </RouterLink>
    <button
      type="button"
      :class="itemClass"
      role="menuitem"
      :disabled="isLoading"
      data-test="account-logout"
      @click="onLogout"
    >
      Logout
    </button>
  </AppDropdownMenu>
</template>
