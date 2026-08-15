<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppFormActions from '@/components/ui/AppFormActions.vue'
import AppFormSection from '@/components/ui/AppFormSection.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useLookups } from '@/composables/useLookups'
import * as lookupService from '@/services/lookupService'
import type { LookupItem } from '@/types/lookup'
import type { User, UserStatus, UserWritePayload } from '@/types/user'
import { toApiClientError } from '@/utils/errors'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    initial?: User | null
    submitting?: boolean
    serverErrors?: Record<string, string[]> | null
    formError?: string | null
    submitLabel?: string | null
  }>(),
  {
    initial: null,
    submitting: false,
    serverErrors: null,
    formError: null,
    submitLabel: null,
  },
)

const emit = defineEmits<{
  submit: [payload: UserWritePayload]
  cancel: []
}>()

const { roleOptions, departmentOptions, isLoading: lookupsLoading, errorMessage: lookupsError } =
  useLookups()

const scopedJobTitles = ref<LookupItem[]>([])
const jobTitlesLoading = ref(false)
const jobTitlesError = ref<string | null>(null)
/** Skip clearing job_title_id while hydrating from props.initial. */
const isHydrating = ref(false)

const form = reactive({
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  password: '',
  role_id: null as number | null,
  department_id: null as number | null,
  job_title_id: null as number | null,
  status: 'active' as UserStatus,
})

const localErrors = reactive<Record<string, string | null>>({
  first_name: null,
  middle_name: null,
  last_name: null,
  email: null,
  password: null,
  role_id: null,
  department_id: null,
  job_title_id: null,
  status: null,
})

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const jobTitleOptions = computed(() =>
  scopedJobTitles.value.map((item) => ({
    value: item.id,
    label: item.name,
  })),
)

const jobTitleDisabled = computed(
  () => form.department_id == null || lookupsLoading.value || jobTitlesLoading.value,
)

const jobTitlePlaceholder = computed(() => {
  if (form.department_id == null) {
    return 'Not Assigned'
  }
  if (jobTitlesLoading.value) {
    return 'Loading…'
  }
  return 'Not Assigned'
})

function fieldError(key: string): string | null {
  return props.serverErrors?.[key]?.[0] ?? localErrors[key] ?? null
}

async function loadJobTitlesForDepartment(
  departmentId: number | null,
  includeId?: number | null,
): Promise<void> {
  if (departmentId == null) {
    scopedJobTitles.value = []
    jobTitlesError.value = null
    return
  }

  jobTitlesLoading.value = true
  jobTitlesError.value = null

  try {
    scopedJobTitles.value = await lookupService.listJobTitlesForDepartment(
      departmentId,
      includeId ?? null,
    )
  } catch (error) {
    const apiError = toApiClientError(error)
    jobTitlesError.value = apiError.message || 'Unable to load job titles.'
    scopedJobTitles.value = []
  } finally {
    jobTitlesLoading.value = false
  }
}

function hydrateFromUser(user: User | null | undefined): void {
  isHydrating.value = true

  if (!user) {
    form.first_name = ''
    form.middle_name = ''
    form.last_name = ''
    form.email = ''
    form.password = ''
    form.role_id = null
    form.department_id = null
    form.job_title_id = null
    form.status = 'active'
    scopedJobTitles.value = []
    isHydrating.value = false
    return
  }

  form.first_name = user.first_name
  form.middle_name = user.middle_name ?? ''
  form.last_name = user.last_name ?? ''
  form.email = user.email
  form.password = ''
  form.role_id = user.role?.id ?? null
  form.department_id = user.department?.id ?? null
  form.job_title_id = user.job_title?.id ?? null
  form.status = (user.status === 'inactive' ? 'inactive' : 'active') as UserStatus

  void loadJobTitlesForDepartment(form.department_id, form.job_title_id).finally(() => {
    isHydrating.value = false
  })
}

watch(
  () => props.initial,
  (value) => {
    hydrateFromUser(value)
  },
  { immediate: true },
)

watch(
  () => form.department_id,
  (departmentId, previousId) => {
    if (isHydrating.value) {
      return
    }
    if (departmentId === previousId) {
      return
    }

    form.job_title_id = null
    void loadJobTitlesForDepartment(departmentId)
  },
)

function resetLocalErrors(): void {
  Object.keys(localErrors).forEach((key) => {
    localErrors[key] = null
  })
}

function validate(): boolean {
  resetLocalErrors()
  let ok = true

  if (!form.first_name.trim()) {
    localErrors.first_name = 'First name is required.'
    ok = false
  }
  if (!form.last_name.trim()) {
    localErrors.last_name = 'Last name is required.'
    ok = false
  }
  if (!form.email.trim()) {
    localErrors.email = 'Email is required.'
    ok = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    localErrors.email = 'Enter a valid email address.'
    ok = false
  }
  if (props.mode === 'create' && !form.password) {
    localErrors.password = 'Password is required.'
    ok = false
  }
  if (form.role_id == null) {
    localErrors.role_id = 'Role is required.'
    ok = false
  }

  return ok
}

const passwordHint = computed(() =>
  props.mode === 'edit' ? 'Leave blank to keep the current password.' : undefined,
)

function onSubmit(): void {
  if (!validate() || form.role_id == null) {
    return
  }

  const payload: UserWritePayload = {
    first_name: form.first_name.trim(),
    middle_name: form.middle_name.trim() || null,
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    role_id: form.role_id,
    department_id: form.department_id,
    job_title_id: form.job_title_id,
    status: form.status,
    avatar: props.initial?.avatar ?? null,
  }

  if (form.password) {
    payload.password = form.password
  }

  emit('submit', payload)
}
</script>

<template>
  <form class="flex flex-col gap-4" data-test="user-form" @submit.prevent="onSubmit">
    <p v-if="lookupsError" class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg">
      {{ lookupsError }}
    </p>
    <p
      v-if="jobTitlesError"
      class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg"
    >
      {{ jobTitlesError }}
    </p>
    <p v-if="formError" class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger-fg" role="alert">
      {{ formError }}
    </p>

    <AppFormSection title="Identity" description="Basic name and email details.">
      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          id="first_name"
          v-model="form.first_name"
          label="First name"
          autocomplete="given-name"
          :error="fieldError('first_name')"
        />
        <AppInput
          id="last_name"
          v-model="form.last_name"
          label="Last name"
          autocomplete="family-name"
          :error="fieldError('last_name')"
        />
        <AppInput
          id="middle_name"
          v-model="form.middle_name"
          label="Middle name"
          autocomplete="additional-name"
          :error="fieldError('middle_name')"
        />
        <AppInput
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          :error="fieldError('email')"
        />
      </div>
    </AppFormSection>

    <AppFormSection title="Access" description="Role, organization placement, and account status.">
      <div class="grid gap-4 sm:grid-cols-2">
        <AppSelect
          id="role_id"
          :model-value="form.role_id"
          label="Role"
          :options="roleOptions"
          :disabled="lookupsLoading"
          :error="fieldError('role_id')"
          :placeholder="lookupsLoading ? 'Loading…' : 'Select a role'"
          @update:model-value="
            (value) => {
              form.role_id = typeof value === 'number' ? value : null
            }
          "
        />
        <AppSelect
          id="status"
          :model-value="form.status"
          label="Status"
          :options="statusOptions"
          :error="fieldError('status')"
          @update:model-value="
            (value) => {
              form.status = value === 'inactive' ? 'inactive' : 'active'
            }
          "
        />
        <AppSelect
          id="department_id"
          :model-value="form.department_id"
          label="Department"
          :options="departmentOptions"
          :disabled="lookupsLoading"
          optional
          :placeholder="lookupsLoading ? 'Loading…' : 'Not Assigned'"
          :error="fieldError('department_id')"
          @update:model-value="
            (value) => {
              form.department_id = typeof value === 'number' ? value : null
            }
          "
        />
        <AppSelect
          id="job_title_id"
          :model-value="form.job_title_id"
          label="Job title"
          :options="jobTitleOptions"
          :disabled="jobTitleDisabled"
          optional
          :placeholder="jobTitlePlaceholder"
          :error="fieldError('job_title_id')"
          @update:model-value="
            (value) => {
              form.job_title_id = typeof value === 'number' ? value : null
            }
          "
        />
        <AppInput
          id="password"
          v-model="form.password"
          class="sm:col-span-2"
          label="Password"
          type="password"
          autocomplete="new-password"
          :placeholder="passwordHint"
          :error="fieldError('password')"
        />
      </div>
    </AppFormSection>

    <AppFormActions>
      <AppButton type="button" variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" :loading="submitting" :disabled="lookupsLoading">
        {{ submitLabel || (mode === 'create' ? 'Create user' : 'Save changes') }}
      </AppButton>
    </AppFormActions>
  </form>
</template>
