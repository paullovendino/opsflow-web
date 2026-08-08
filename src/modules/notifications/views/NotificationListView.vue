<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useNotificationList } from '@/composables/useNotificationList'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/stores/notifications'
import { formatRelativeTime } from '@/utils/format'
import { notificationMessage, notificationTargetRoute, notificationTitle } from '@/utils/notifications'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'
import { toApiClientError } from '@/utils/errors'

const headingRef = ref<HTMLElement | null>(null)
const toast = useToast()
const router = useRouter()
const previewStore = useNotificationsStore()

const {
  notifications,
  meta,
  filters,
  isLoading,
  errorMessage,
  isEmpty,
  isMutating,
  load,
  retry,
  setPage,
  setUnreadOnly,
  markRead,
  markAllRead,
} = useNotificationList({ perPage: 15 })

const showSkeleton = computed(() => isInitialListLoading(isLoading.value, notifications.value.length))
const softRefresh = computed(() => isSoftListRefresh(isLoading.value, notifications.value.length))

async function onOpen(id: number): Promise<void> {
  const item = notifications.value.find((notification) => notification.id === id)
  try {
    if (item && item.read_at == null) {
      await markRead(id)
      await previewStore.refresh({ quiet: true })
    }
    const route = item ? notificationTargetRoute(item) : null
    if (route) {
      await router.push(route)
    }
  } catch (error) {
    toast.error(toApiClientError(error).message || 'Unable to open notification.')
  }
}

async function onMarkAll(): Promise<void> {
  try {
    await markAllRead()
    await previewStore.refresh({ quiet: true })
    toast.success('All notifications marked as read.')
  } catch (error) {
    toast.error(toApiClientError(error).message || 'Unable to mark notifications as read.')
  }
}

onMounted(async () => {
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader title="Notifications" description="In-app alerts for assignments, membership, remarks, and mentions.">
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <AppButton
              type="button"
              variant="secondary"
              :disabled="isMutating"
              data-test="notifications-filter-unread"
              @click="void setUnreadOnly(!filters.unreadOnly)"
            >
              {{ filters.unreadOnly ? 'Show all' : 'Unread only' }}
            </AppButton>
            <AppButton type="button" :loading="isMutating" data-test="notifications-mark-all" @click="onMarkAll">
              Mark all as read
            </AppButton>
          </div>
        </template>
      </AppPageHeader>
    </div>

    <div v-if="showSkeleton" class="space-y-3" aria-busy="true" aria-label="Loading notifications">
      <div v-for="index in 5" :key="index" class="rounded-xl border border-slate-200 bg-white p-4">
        <AppSkeleton class="h-4 w-1/3" />
        <AppSkeleton class="mt-2 h-3 w-2/3" />
      </div>
    </div>

    <div
      v-else-if="errorMessage && notifications.length === 0"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-red-900">Couldn't load notifications</h2>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <AppEmptyState
      v-else-if="isEmpty"
      title="No notifications"
      description="When teammates assign work or mention you, it will show up here."
    />

    <div v-else class="space-y-3 transition-opacity" :class="{ 'opacity-60': softRefresh }" :aria-busy="isLoading">
      <button
        v-for="item in notifications"
        :key="item.id"
        type="button"
        class="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300"
        :class="item.read_at ? '' : 'ring-1 ring-sky-200'"
        data-test="notification-row"
        @click="onOpen(item.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900">{{ notificationTitle(item) }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ notificationMessage(item) }}</p>
            <p class="mt-2 text-xs text-slate-400">{{ formatRelativeTime(item.created_at) }}</p>
          </div>
          <span
            v-if="!item.read_at"
            class="mt-1 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800"
          >
            Unread
          </span>
        </div>
      </button>

      <div v-if="meta && meta.last_page > 1">
        <AppPagination :meta="meta" :disabled="isLoading" @change="setPage" />
      </div>
    </div>
  </div>
</template>
