<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppProgressBar from '@/components/ui/AppProgressBar.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppToastHost from '@/components/ui/AppToastHost.vue'
import { useAuth } from '@/composables/useAuth'

const { isBootstrapped } = useAuth()
</script>

<template>
  <AppProgressBar />
  <AppToastHost />
  <div v-if="!isBootstrapped" class="flex min-h-screen items-center justify-center bg-canvas">
    <AppSpinner block label="Starting OpsFlow…" />
  </div>
  <RouterView v-else />
</template>
