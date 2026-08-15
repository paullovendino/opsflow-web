<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppDetailSkeleton from '@/components/ui/AppDetailSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFormActions from '@/components/ui/AppFormActions.vue'
import AppFormSection from '@/components/ui/AppFormSection.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useProfile } from '@/composables/useProfile'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import AvatarUploader from '@/modules/users/components/AvatarUploader.vue'
import type { ProfileUpdatePayload, ProfileUser, ThemePreference } from '@/types/profile'
import { THEME_PREFERENCE_OPTIONS } from '@/types/profile'
import { activityHeadline, activitySubjectLabel } from '@/utils/activity'
import { formatDateTime, humanizeKey } from '@/utils/format'

const toast = useToast()
const { summary, user, isLoading, isSaving, errorMessage, serverErrors, load, save, applyProfileUser } =
  useProfile()
const { themePreference, setPreference } = useTheme()

const headingRef = ref<HTMLElement | null>(null)

const form = reactive({
  first_name: '',
  middle_name: '',
  last_name: '',
  password: '',
  password_confirmation: '',
  theme_preference: 'system' as ThemePreference,
  notify_task_assigned: true,
  notify_task_status: true,
  notify_remarks: true,
  notify_mentions: true,
})

const localErrors = reactive<Record<string, string | null>>({
  first_name: null,
  last_name: null,
  password: null,
  password_confirmation: null,
})

function fieldError(key: string): string | null {
  return serverErrors.value?.[key]?.[0] ?? localErrors[key] ?? null
}

function clearLocalErrors(): void {
  Object.keys(localErrors).forEach((key) => {
    localErrors[key] = null
  })
}

function hydrateForm(): void {
  if (!user.value) return
  form.first_name = user.value.first_name
  form.middle_name = user.value.middle_name ?? ''
  form.last_name = user.value.last_name ?? ''
  form.password = ''
  form.password_confirmation = ''
  form.theme_preference = (user.value.theme_preference as ThemePreference) || 'system'
  form.notify_task_assigned = Boolean(user.value.notify_task_assigned)
  form.notify_task_status = Boolean(user.value.notify_task_status)
  form.notify_remarks = Boolean(user.value.notify_remarks)
  form.notify_mentions = Boolean(user.value.notify_mentions)
  clearLocalErrors()
}

watch(
  user,
  () => {
    hydrateForm()
  },
  { immediate: true },
)

function validateLocal(): boolean {
  clearLocalErrors()
  let ok = true

  if (!form.first_name.trim()) {
    localErrors.first_name = 'First name is required.'
    ok = false
  }
  if (!form.last_name.trim()) {
    localErrors.last_name = 'Last name is required.'
    ok = false
  }
  if (form.password || form.password_confirmation) {
    if (form.password.length < 8) {
      localErrors.password = 'Password must be at least 8 characters.'
      ok = false
    }
    if (form.password !== form.password_confirmation) {
      localErrors.password_confirmation = 'Password confirmation does not match.'
      ok = false
    }
  }

  return ok
}

watch(
  themePreference,
  (value) => {
    form.theme_preference = value
  },
)

async function onThemeSelect(next: ThemePreference): Promise<void> {
  form.theme_preference = next
  await setPreference(next)
}

async function onSubmit(): Promise<void> {
  if (!validateLocal()) return

  const payload: ProfileUpdatePayload = {
    first_name: form.first_name.trim(),
    middle_name: form.middle_name.trim() || null,
    last_name: form.last_name.trim(),
    theme_preference: form.theme_preference,
    notify_task_assigned: form.notify_task_assigned,
    notify_task_status: form.notify_task_status,
    notify_remarks: form.notify_remarks,
    notify_mentions: form.notify_mentions,
  }

  if (form.password) {
    payload.password = form.password
    payload.password_confirmation = form.password_confirmation
  }

  const ok = await save(payload)
  if (ok) {
    form.password = ''
    form.password_confirmation = ''
    toast.success('Profile updated.')
  }
}

function onAvatarUpdated(next: ProfileUser): void {
  applyProfileUser(next)
  toast.success(next.avatar ? 'Avatar updated.' : 'Avatar removed.')
}

const managedFields = computed(() => [
  { label: 'Email', value: user.value?.email ?? '—' },
  { label: 'Role', value: user.value?.role ? humanizeKey(user.value.role.name) : '—' },
  { label: 'Department', value: user.value?.department?.name ?? '—' },
  { label: 'Job title', value: user.value?.job_title?.name ?? '—' },
  { label: 'Status', value: user.value?.status ?? '—' },
])

onMounted(async () => {
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        title="My profile"
        description="Update your personal details and preferences. Organization fields are managed by an administrator."
      />
    </div>

    <AppDetailSkeleton v-if="isLoading && !summary" />

    <div
      v-else-if="errorMessage && !summary"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
      data-test="profile-load-error"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load profile</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else-if="summary && user">
      <AppFormSection title="Profile photo" description="Upload a JPEG, PNG, or WEBP image up to 2 MB.">
        <AvatarUploader :name="user.full_name" :avatar="user.avatar" @updated="onAvatarUpdated" />
      </AppFormSection>

      <div class="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p class="truncate text-lg font-semibold text-fg">{{ user.full_name }}</p>
        <p class="truncate text-sm text-fg-subtle">{{ user.email }}</p>
      </div>

      <form class="flex flex-col gap-6" data-test="profile-form" @submit.prevent="onSubmit">
        <p
          v-if="errorMessage"
          class="rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg"
          role="alert"
          data-test="profile-form-error"
        >
          {{ errorMessage }}
        </p>

        <AppFormSection title="Personal information" description="Your display name on OpsFlow.">
          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput
              id="profile_first_name"
              label="First name"
              :model-value="form.first_name"
              :error="fieldError('first_name')"
              autocomplete="given-name"
              @update:model-value="form.first_name = $event"
            />
            <AppInput
              id="profile_middle_name"
              label="Middle name"
              :model-value="form.middle_name"
              :error="fieldError('middle_name')"
              autocomplete="additional-name"
              @update:model-value="form.middle_name = $event"
            />
            <AppInput
              id="profile_last_name"
              label="Last name"
              :model-value="form.last_name"
              :error="fieldError('last_name')"
              autocomplete="family-name"
              @update:model-value="form.last_name = $event"
            />
          </div>
        </AppFormSection>

        <AppFormSection
          title="Password"
          description="Leave blank to keep your current password."
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput
              id="profile_password"
              label="New password"
              type="password"
              :model-value="form.password"
              :error="fieldError('password')"
              autocomplete="new-password"
              @update:model-value="form.password = $event"
            />
            <AppInput
              id="profile_password_confirmation"
              label="Confirm password"
              type="password"
              :model-value="form.password_confirmation"
              :error="fieldError('password_confirmation')"
              autocomplete="new-password"
              @update:model-value="form.password_confirmation = $event"
            />
          </div>
        </AppFormSection>

        <AppFormSection
          title="Notification preferences"
          description="Control which in-app notifications you receive."
        >
          <div class="flex flex-col gap-3">
            <label class="flex items-start gap-3 text-sm text-fg-secondary">
              <input
                v-model="form.notify_task_assigned"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-border-strong text-fg focus:ring-ring"
                data-test="notify-task-assigned"
              />
              <span>
                <span class="font-medium text-fg">Task assignment</span>
                <span class="mt-0.5 block text-fg-subtle">When a task is assigned to you</span>
              </span>
            </label>
            <label class="flex items-start gap-3 text-sm text-fg-secondary">
              <input
                v-model="form.notify_task_status"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-border-strong text-fg focus:ring-ring"
                data-test="notify-task-status"
              />
              <span>
                <span class="font-medium text-fg">Task status</span>
                <span class="mt-0.5 block text-fg-subtle">When status changes on your assigned tasks</span>
              </span>
            </label>
            <label class="flex items-start gap-3 text-sm text-fg-secondary">
              <input
                v-model="form.notify_remarks"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-border-strong text-fg focus:ring-ring"
                data-test="notify-remarks"
              />
              <span>
                <span class="font-medium text-fg">Remarks</span>
                <span class="mt-0.5 block text-fg-subtle">Comments on work you own or are assigned</span>
              </span>
            </label>
            <label class="flex items-start gap-3 text-sm text-fg-secondary">
              <input
                v-model="form.notify_mentions"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-border-strong text-fg focus:ring-ring"
                data-test="notify-mentions"
              />
              <span>
                <span class="font-medium text-fg">Mentions</span>
                <span class="mt-0.5 block text-fg-subtle">When someone mentions you in a remark</span>
              </span>
            </label>
          </div>
        </AppFormSection>

        <AppFormSection
          title="Appearance"
          description="Choose System to follow your device, or lock Light or Dark."
        >
          <div
            class="grid gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Theme preference"
            data-test="profile-theme-options"
          >
            <button
              v-for="option in THEME_PREFERENCE_OPTIONS"
              :key="option.value"
              type="button"
              role="radio"
              class="rounded-lg border px-3 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              :class="
                form.theme_preference === option.value
                  ? 'border-inverse bg-inverse text-on-inverse'
                  : 'border-border-strong bg-surface text-fg hover:bg-surface-hover'
              "
              :aria-checked="form.theme_preference === option.value"
              :data-test="`profile-theme-${option.value}`"
              @click="onThemeSelect(option.value)"
            >
              <span class="block font-medium">{{ option.label }}</span>
              <span
                class="mt-1 block text-xs"
                :class="form.theme_preference === option.value ? 'text-on-inverse/80' : 'text-fg-muted'"
              >
                <template v-if="option.value === 'system'">Match device setting</template>
                <template v-else-if="option.value === 'light'">Always light</template>
                <template v-else>Always dark</template>
              </span>
            </button>
          </div>
          <p v-if="fieldError('theme_preference')" class="mt-2 text-sm text-danger-fg">
            {{ fieldError('theme_preference') }}
          </p>
        </AppFormSection>

        <AppFormActions>
          <AppButton
            type="submit"
            :loading="isSaving"
            :disabled="isSaving"
            loading-label="Saving…"
            data-test="profile-save"
          >
            Save changes
          </AppButton>
        </AppFormActions>
      </form>

      <AppFormSection title="Managed by administrator" description="These fields cannot be changed here.">
        <dl class="grid gap-4 sm:grid-cols-2" data-test="managed-fields">
          <div v-for="field in managedFields" :key="field.label">
            <dt class="text-sm text-fg-muted">{{ field.label }}</dt>
            <dd class="mt-1 text-fg">
              <StatusBadge v-if="field.label === 'Status'" :status="String(field.value)" kind="user" />
              <AppBadge
                v-else-if="field.label === 'Role' && user.role"
                tone="sky"
                :label="humanizeKey(user.role.name)"
              />
              <template v-else>{{ field.value }}</template>
            </dd>
          </div>
        </dl>
      </AppFormSection>

      <AppFormSection title="Your work" description="Quick counts for projects and assigned tasks.">
        <div class="grid gap-3 sm:grid-cols-2" data-test="profile-work-summary">
          <div class="rounded-lg border border-border px-4 py-3">
            <p class="text-sm text-fg-muted">Owned projects</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-fg">
              {{ summary.projects.owned_count }}
            </p>
          </div>
          <div class="rounded-lg border border-border px-4 py-3">
            <p class="text-sm text-fg-muted">Member projects</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-fg">
              {{ summary.projects.member_count }}
            </p>
          </div>
          <div class="rounded-lg border border-border px-4 py-3">
            <p class="text-sm text-fg-muted">Open assigned tasks</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-fg">
              {{ summary.tasks.assigned_open }}
            </p>
          </div>
          <div class="rounded-lg border border-border px-4 py-3">
            <p class="text-sm text-fg-muted">Overdue assigned</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-fg">
              {{ summary.tasks.assigned_overdue }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 text-sm">
          <RouterLink class="font-medium text-fg-secondary underline-offset-2 hover:underline" :to="{ name: 'projects.index' }">
            Browse projects
          </RouterLink>
          <RouterLink class="font-medium text-fg-secondary underline-offset-2 hover:underline" :to="{ name: 'tasks.index' }">
            Browse tasks
          </RouterLink>
        </div>
      </AppFormSection>

      <AppFormSection title="Recent activity" description="Significant changes recorded for your account.">
        <AppEmptyState
          v-if="summary.recent_activity.length === 0"
          title="No recent activity"
          description="Profile and account changes will appear here."
        />
        <ol v-else class="space-y-3" data-test="profile-recent-activity">
          <li
            v-for="log in summary.recent_activity"
            :key="log.id"
            class="border-l border-border pl-3"
          >
            <p class="text-sm font-medium text-fg">{{ activityHeadline(log) }}</p>
            <p class="mt-0.5 text-xs text-fg-muted">
              {{ activitySubjectLabel(log) }} · {{ formatDateTime(log.created_at) }}
            </p>
          </li>
        </ol>
      </AppFormSection>
    </template>
  </div>
</template>
