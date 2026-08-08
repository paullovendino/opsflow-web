<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/composables/useAuth'
import { useUiStore } from '@/stores/ui'

const appName = import.meta.env.VITE_APP_NAME || 'OpsFlow'
const ui = useUiStore()
const { isSidebarOpen } = storeToRefs(ui)
const { roleName, user } = useAuth()

const showUsers = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const showEmployeeReports = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const showActivity = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const myReportTo = computed(() =>
  user.value?.id
    ? { name: 'reports.employees.show' as const, params: { id: user.value.id } }
    : { name: 'reports.projects.index' as const },
)

const linkClass =
  'rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'
const activeClass = 'bg-slate-900 text-white hover:bg-slate-900'
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0"
    :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Primary"
  >
    <div class="border-b border-slate-200 px-5 py-4">
      <p class="text-lg font-semibold tracking-tight text-slate-900">{{ appName }}</p>
      <p class="text-xs text-slate-500">Operations workspace</p>
    </div>

    <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
      <RouterLink
        :to="{ name: 'dashboard' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Dashboard
      </RouterLink>

      <RouterLink
        v-if="showUsers"
        :to="{ name: 'users.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Users
      </RouterLink>

      <RouterLink
        :to="{ name: 'projects.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Projects
      </RouterLink>

      <RouterLink
        :to="{ name: 'tasks.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Tasks
      </RouterLink>

      <RouterLink
        v-if="showActivity"
        :to="{ name: 'activity.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Activity
      </RouterLink>

      <RouterLink
        :to="{ name: 'notifications.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Notifications
      </RouterLink>

      <RouterLink
        :to="{ name: 'reports.projects.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Reports
      </RouterLink>

      <RouterLink
        v-if="showEmployeeReports"
        :to="{ name: 'reports.employees.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Employee reports
      </RouterLink>

      <RouterLink
        v-else
        :to="myReportTo"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        My report
      </RouterLink>

      <RouterLink
        :to="{ name: 'profile' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Profile
      </RouterLink>
    </nav>
  </aside>
</template>
