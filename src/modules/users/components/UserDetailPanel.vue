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
      <dt class="text-sm text-slate-500">Full name</dt>
      <dd class="mt-1 text-lg font-semibold text-slate-900">{{ user.full_name }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">First name</dt>
      <dd class="mt-1 text-slate-900">{{ user.first_name }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Middle name</dt>
      <dd class="mt-1 text-slate-900">{{ user.middle_name || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Last name</dt>
      <dd class="mt-1 text-slate-900">{{ user.last_name || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Email</dt>
      <dd class="mt-1 text-slate-900">{{ user.email }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Status</dt>
      <dd class="mt-1">
        <StatusBadge :status="String(user.status)" kind="user" />
      </dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Role</dt>
      <dd class="mt-1">
        <AppBadge v-if="user.role" tone="sky" :label="humanizeKey(user.role.name)" />
        <span v-else>—</span>
      </dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Department</dt>
      <dd class="mt-1 text-slate-900">{{ user.department?.name || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Job title</dt>
      <dd class="mt-1 text-slate-900">{{ user.job_title?.name || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Last login</dt>
      <dd class="mt-1 text-slate-900">
        {{ user.last_login_at ? formatDateTime(user.last_login_at) : '—' }}
      </dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Avatar</dt>
      <dd class="mt-1 text-slate-900">{{ user.avatar || '—' }}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">User ID</dt>
      <dd class="mt-1 text-slate-900">{{ user.id }}</dd>
    </div>
  </dl>
</template>
