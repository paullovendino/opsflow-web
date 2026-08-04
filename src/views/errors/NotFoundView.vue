<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-3 px-4">
    <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">404</p>
    <h1 class="text-3xl font-semibold text-slate-900">Page not found</h1>
    <p class="text-sm text-slate-600">The page you requested does not exist.</p>
    <RouterLink class="text-sm font-medium text-slate-900 underline" :to="{ name: 'home' }">
      Go to Home
    </RouterLink>
  </div>
</template>
