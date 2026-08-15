<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useAuth } from '@/composables/useAuth'
import { toApiClientError } from '@/utils/errors'

const appName = import.meta.env.VITE_APP_NAME || 'OpsFlow'
const router = useRouter()
const route = useRoute()
const { login, refreshUser, isLoading } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const fieldErrors = reactive<{
  email: string | null
  password: string | null
}>({
  email: null,
  password: null,
})

const formError = ref<string | null>(null)

function resetErrors(): void {
  fieldErrors.email = null
  fieldErrors.password = null
  formError.value = null
}

function validateClient(): boolean {
  let ok = true

  if (!form.email.trim()) {
    fieldErrors.email = 'Email is required.'
    ok = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    fieldErrors.email = 'Enter a valid email address.'
    ok = false
  }

  if (!form.password) {
    fieldErrors.password = 'Password is required.'
    ok = false
  }

  return ok
}

async function onSubmit(): Promise<void> {
  resetErrors()

  if (!validateClient()) {
    return
  }

  try {
    await login({
      email: form.email.trim(),
      password: form.password,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.replace(redirect || { name: 'dashboard' })
  } catch (error) {
    const apiError = toApiClientError(error)

    if (apiError.status === 422) {
      fieldErrors.email = apiError.errors?.email?.[0] ?? null
      fieldErrors.password = apiError.errors?.password?.[0] ?? null
      formError.value = apiError.message
      return
    }

    if (apiError.status === 403 && apiError.message === 'Account is inactive.') {
      formError.value = apiError.message
      return
    }

    if (apiError.status === 403 && apiError.message === 'Already authenticated.') {
      await refreshUser()
      await router.replace({ name: 'dashboard' })
      return
    }

    if (apiError.status === 401) {
      formError.value = apiError.message || 'Invalid credentials.'
      return
    }

    if (apiError.status === 429) {
      formError.value = apiError.message || 'Too many attempts. Please try again later.'
      return
    }

    formError.value = apiError.message
  }
}
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-6 shadow-sm">
    <div class="mb-6">
      <p class="text-2xl font-semibold tracking-tight text-fg">{{ appName }}</p>
      <p class="mt-1 text-sm text-fg-subtle">Sign in to continue</p>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <AppInput
        id="email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="username"
        :error="fieldErrors.email"
      />
      <AppInput
        id="password"
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
      />

      <p v-if="formError" class="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-red-700">
        {{ formError }}
      </p>

      <AppButton type="submit" class="w-full" :loading="isLoading">Sign in</AppButton>
    </form>
  </div>
</template>
