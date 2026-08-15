<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { User } from '@/types/user'
import { formatDateTime, humanizeKey } from '@/utils/format'

defineProps<{
  user: User
}>()
</script>

<template>
  <dl class="grid gap-4 sm:grid-cols-2">
    <div class="sm:col-span-2">
      <dt class="text-sm text-fg-muted">Full name</dt>
      <dd class="mt-1 text-lg font-semibold text-fg">{{ user.full_name }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">First name</dt>
      <dd class="mt-1 text-fg">{{ user.first_name }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Middle name</dt>
      <dd class="mt-1 text-fg">{{ user.middle_name || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Last name</dt>
      <dd class="mt-1 text-fg">{{ user.last_name || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Email</dt>
      <dd class="mt-1 text-fg">{{ user.email }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Status</dt>
      <dd class="mt-1">
        <StatusBadge :status="String(user.status)" kind="user" />
      </dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Role</dt>
      <dd class="mt-1">
        <AppBadge v-if="user.role" tone="sky" :label="humanizeKey(user.role.name)" />
        <span v-else>—</span>
      </dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Department</dt>
      <dd class="mt-1 text-fg">{{ user.department?.name || 'Not Assigned' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Job title</dt>
      <dd class="mt-1 text-fg">{{ user.job_title?.name || 'Not Assigned' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Last login</dt>
      <dd class="mt-1 text-fg">
        {{ user.last_login_at ? formatDateTime(user.last_login_at) : '—' }}
      </dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">Avatar</dt>
      <dd class="mt-1 text-fg">{{ user.avatar || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-fg-muted">User ID</dt>
      <dd class="mt-1 text-fg">{{ user.id }}</dd>
    </div>
  </dl>
</template>
