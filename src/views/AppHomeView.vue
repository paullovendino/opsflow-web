<script setup lang="ts">
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useAuth } from '@/composables/useAuth'

const { fullName, roleName } = useAuth()
</script>

<template>
  <AppEmptyState
    title="OpsFlow foundation is ready"
    :description="`Signed in as ${fullName}${roleName ? ` (${roleName})` : ''}. Feature modules (Dashboard, Users, Projects, Tasks, Reports) will be added in later milestones.`"
  />
</template>
