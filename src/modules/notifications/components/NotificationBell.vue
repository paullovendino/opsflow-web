<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppDropdownMenu from '@/components/ui/AppDropdownMenu.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/stores/notifications'
import { formatRelativeTime } from '@/utils/format'
import { notificationMessage, notificationTargetRoute, notificationTitle } from '@/utils/notifications'
import { toApiClientError } from '@/utils/errors'

const router = useRouter()
const toast = useToast()
const store = useNotificationsStore()
const { unreadCount, preview, isLoading, isRefreshing, isMutating, errorMessage, isOpen, hasUnread, isEmpty } =
  storeToRefs(store)

function toggle(): void {
  store.setOpen(!isOpen.value)
}

function close(): void {
  store.setOpen(false)
}

async function onItemClick(id: number): Promise<void> {
  const item = preview.value.find((notification) => notification.id === id)
  close()
  try {
    if (item && item.read_at == null) {
      await store.markRead(id)
    }
    const route = item ? notificationTargetRoute(item) : { name: 'notifications.index' }
    if (route) {
      await router.push(route)
    }
  } catch (error) {
    toast.error(toApiClientError(error).message || 'Unable to open notification.')
  }
}

async function onMarkAll(): Promise<void> {
  try {
    await store.markAllRead()
    toast.success('All notifications marked as read.')
  } catch (error) {
    toast.error(toApiClientError(error).message || 'Unable to mark notifications as read.')
  }
}

function viewAll(): void {
  close()
  void router.push({ name: 'notifications.index' })
}
</script>

<template>
  <AppDropdownMenu :open="isOpen" align="end" menu-class="w-80 sm:w-96" @update:open="store.setOpen">
    <template #trigger>
      <button
        type="button"
        class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-page"
        :aria-expanded="isOpen"
        aria-haspopup="true"
        :aria-label="hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications'"
        data-test="notification-bell"
        @click.stop="toggle"
      >
        <span aria-hidden="true" class="text-base leading-none">🔔</span>
        <span
          v-if="hasUnread"
          class="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
          data-test="notification-badge"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </template>

    <div class="border-b border-border px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold text-fg">Notifications</p>
        <AppButton
          type="button"
          variant="secondary"
          :disabled="!hasUnread || isMutating"
          :loading="isMutating"
          data-test="notification-mark-all"
          @click="onMarkAll"
        >
          Mark all read
        </AppButton>
      </div>
    </div>

    <div v-if="isLoading && preview.length === 0" class="space-y-2 p-3" aria-busy="true" aria-label="Loading notifications">
      <AppSkeleton class="h-10 w-full" />
      <AppSkeleton class="h-10 w-full" />
      <AppSkeleton class="h-10 w-full" />
    </div>

    <div v-else-if="errorMessage && preview.length === 0" class="p-3" role="alert">
      <p class="text-sm text-danger-fg">{{ errorMessage }}</p>
      <AppButton type="button" variant="secondary" class="mt-2" data-test="notification-retry" @click="store.retry">
        Try again
      </AppButton>
    </div>

    <AppEmptyState
      v-else-if="isEmpty"
      title="No notifications"
      description="You’re all caught up."
    />

    <div v-else class="max-h-80 overflow-y-auto py-1" :class="{ 'opacity-60': isRefreshing }" :aria-busy="isRefreshing">
      <button
        v-for="item in preview"
        :key="item.id"
        type="button"
        role="menuitem"
        class="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-hover focus:bg-muted focus-visible:bg-canvas"
        :class="item.read_at ? 'text-fg-subtle' : 'bg-muted text-fg'"
        data-test="notification-preview-item"
        @click="onItemClick(item.id)"
      >
        <span class="flex w-full items-start justify-between gap-2">
          <span class="text-sm font-medium">{{ notificationTitle(item) }}</span>
          <span
            v-if="!item.read_at"
            class="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600"
            aria-label="Unread"
          />
        </span>
        <span class="line-clamp-2 text-xs text-fg-subtle">{{ notificationMessage(item) }}</span>
        <span class="text-[11px] text-slate-400">{{ formatRelativeTime(item.created_at) }}</span>
      </button>
    </div>

    <div class="border-t border-border px-3 py-2">
      <button
        type="button"
        class="w-full rounded-md px-2 py-1.5 text-sm font-medium text-fg-secondary hover:bg-surface-hover"
        data-test="notification-view-all"
        @click="viewAll"
      >
        View all notifications
      </button>
    </div>
  </AppDropdownMenu>
</template>
