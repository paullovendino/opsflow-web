<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import * as profileService from '@/services/profileService'
import { AVATAR_ACCEPT } from '@/services/profileService'
import type { ProfileUser } from '@/types/profile'
import { toApiClientError } from '@/utils/errors'

const props = defineProps<{
  name: string
  avatar: string | null
}>()

const emit = defineEmits<{
  updated: [user: ProfileUser]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isUploading = ref(false)
const isRemoving = ref(false)
const errorMessage = ref<string | null>(null)

const displayAvatar = computed(() => previewUrl.value ?? props.avatar)
const isBusy = computed(() => isUploading.value || isRemoving.value)
const canRemove = computed(() => Boolean(props.avatar) && !previewUrl.value)

watch(
  () => props.avatar,
  () => {
    if (!selectedFile.value) {
      clearPreview()
    }
  },
)

function clearPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  selectedFile.value = null
}

function openPicker(): void {
  if (isBusy.value) return
  errorMessage.value = null
  fileInput.value?.click()
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''

  errorMessage.value = null
  clearPreview()

  if (!file) return

  const validationError = profileService.validateAvatarFile(file)
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function confirmUpload(): Promise<void> {
  if (!selectedFile.value || isBusy.value) return

  isUploading.value = true
  errorMessage.value = null

  try {
    const summary = await profileService.uploadAvatar(selectedFile.value)
    clearPreview()
    emit('updated', summary.user)
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value =
      apiError.errors?.avatar?.[0] || apiError.message || 'Unable to upload avatar.'
  } finally {
    isUploading.value = false
  }
}

function cancelPreview(): void {
  if (isBusy.value) return
  clearPreview()
  errorMessage.value = null
}

async function onRemove(): Promise<void> {
  if (!canRemove.value || isBusy.value) return

  isRemoving.value = true
  errorMessage.value = null

  try {
    const summary = await profileService.removeAvatar()
    clearPreview()
    emit('updated', summary.user)
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value = apiError.message || 'Unable to remove avatar.'
  } finally {
    isRemoving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-3" data-test="avatar-uploader">
    <div class="flex flex-wrap items-center gap-4">
      <button
        type="button"
        class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:opacity-60"
        :disabled="isBusy"
        aria-label="Change photo"
        data-test="avatar-uploader-trigger"
        @click="openPicker"
      >
        <AppAvatar :name="name" :avatar="displayAvatar" size="lg" />
      </button>

      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap gap-2">
          <AppButton
            type="button"
            variant="secondary"
            :disabled="isBusy"
            data-test="avatar-change"
            @click="openPicker"
          >
            Change photo
          </AppButton>
          <AppButton
            v-if="selectedFile"
            type="button"
            :loading="isUploading"
            :disabled="isBusy"
            loading-label="Uploading…"
            data-test="avatar-confirm"
            @click="confirmUpload"
          >
            Save photo
          </AppButton>
          <AppButton
            v-if="selectedFile"
            type="button"
            variant="secondary"
            :disabled="isBusy"
            data-test="avatar-cancel"
            @click="cancelPreview"
          >
            Cancel
          </AppButton>
          <AppButton
            v-if="canRemove"
            type="button"
            variant="secondary"
            :loading="isRemoving"
            :disabled="isBusy"
            loading-label="Removing…"
            data-test="avatar-remove"
            @click="onRemove"
          >
            Remove photo
          </AppButton>
        </div>
        <p class="text-xs text-fg-muted">JPEG, PNG, or WEBP · max 2 MB</p>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="AVATAR_ACCEPT"
      data-test="avatar-file-input"
      @change="onFileChange"
    />

    <p v-if="previewUrl" class="text-sm text-fg-subtle" data-test="avatar-preview-hint">
      Preview ready — save to upload.
    </p>
    <p v-if="errorMessage" class="text-sm text-danger-fg" role="alert" data-test="avatar-error">
      {{ errorMessage }}
    </p>
  </div>
</template>
