<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-3 px-4">
    <p class="text-sm font-semibold uppercase tracking-wide text-fg-muted">404</p>
    <h1 class="text-3xl font-semibold text-fg">Page not found</h1>
    <p class="text-sm text-fg-subtle">The page you requested does not exist.</p>
    <RouterLink class="text-sm font-medium text-fg underline" :to="{ name: 'dashboard' }">
      Go to Dashboard
    </RouterLink>
  </div>
</template>
