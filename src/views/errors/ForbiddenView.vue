<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-3 px-4">
    <p class="text-sm font-semibold uppercase tracking-wide text-fg-muted">403</p>
    <h1 class="text-3xl font-semibold text-fg">Forbidden</h1>
    <p class="text-sm text-fg-subtle">You do not have permission to view this page.</p>
    <RouterLink class="text-sm font-medium text-fg underline" :to="{ name: 'dashboard' }">
      Go to Dashboard
    </RouterLink>
  </div>
</template>
