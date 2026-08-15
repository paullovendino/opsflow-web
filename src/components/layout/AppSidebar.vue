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

const isAdministrator = computed(() => roleName.value === 'administrator')

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
  'rounded-md px-3 py-2 text-sm font-medium text-fg-secondary hover:bg-surface-hover'
const activeClass = 'bg-inverse text-on-inverse hover:bg-inverse'
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform md:static md:translate-x-0"
    :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Primary"
  >
    <div class="border-b border-border px-5 py-4">
      <p class="text-lg font-semibold tracking-tight text-fg">{{ appName }}</p>
      <p class="text-xs text-fg-muted">Operations workspace</p>
    </div>

    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main">
      <RouterLink
        :to="{ name: 'dashboard' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Dashboard
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
        v-if="showActivity"
        :to="{ name: 'activity.index' }"
        :class="linkClass"
        :active-class="activeClass"
        @click="ui.closeSidebar()"
      >
        Activity
      </RouterLink>

      <template v-if="showUsers">
        <p
          class="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted"
          data-test="nav-administration-label"
        >
          Administration
        </p>

        <RouterLink
          :to="{ name: 'users.index' }"
          :class="linkClass"
          :active-class="activeClass"
          @click="ui.closeSidebar()"
        >
          Users
        </RouterLink>

        <RouterLink
          v-if="isAdministrator"
          :to="{ name: 'departments.index' }"
          :class="linkClass"
          :active-class="activeClass"
          data-test="nav-departments"
          @click="ui.closeSidebar()"
        >
          Departments
        </RouterLink>

        <RouterLink
          v-if="isAdministrator"
          :to="{ name: 'job-titles.index' }"
          :class="linkClass"
          :active-class="activeClass"
          data-test="nav-job-titles"
          @click="ui.closeSidebar()"
        >
          Job Titles
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>
