import { createRouter, createWebHistory } from 'vue-router'
import GuestLayout from '@/layouts/GuestLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import DashboardView from '@/modules/dashboard/views/DashboardView.vue'
import UserListView from '@/modules/users/views/UserListView.vue'
import UserShowView from '@/modules/users/views/UserShowView.vue'
import ProfileView from '@/modules/users/views/ProfileView.vue'
import ProjectListView from '@/modules/projects/views/ProjectListView.vue'
import ProjectShowView from '@/modules/projects/views/ProjectShowView.vue'
import TaskListView from '@/modules/tasks/views/TaskListView.vue'
import TaskShowView from '@/modules/tasks/views/TaskShowView.vue'
import ProjectReportsListView from '@/modules/reports/views/ProjectReportsListView.vue'
import ProjectReportShowView from '@/modules/reports/views/ProjectReportShowView.vue'
import EmployeeReportsListView from '@/modules/reports/views/EmployeeReportsListView.vue'
import EmployeeReportShowView from '@/modules/reports/views/EmployeeReportShowView.vue'
import ActivityListView from '@/modules/activity/views/ActivityListView.vue'
import NotificationListView from '@/modules/notifications/views/NotificationListView.vue'
import DepartmentListView from '@/modules/departments/views/DepartmentListView.vue'
import JobTitleListView from '@/modules/job-titles/views/JobTitleListView.vue'
import { setupRouterGuards } from '@/router/guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: GuestLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginView,
          meta: {
            guest: true,
            title: 'Login',
          },
        },
      ],
    },
    {
      path: '/',
      component: AuthLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          redirect: { name: 'dashboard' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: {
            requiresAuth: true,
            title: 'Dashboard',
          },
        },
        {
          path: 'users',
          name: 'users.index',
          component: UserListView,
          meta: {
            requiresAuth: true,
            title: 'Users',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'users/create',
          name: 'users.create',
          component: UserListView,
          meta: {
            requiresAuth: true,
            title: 'Create user',
            roles: ['administrator'],
          },
        },
        {
          path: 'users/:id/edit',
          name: 'users.edit',
          component: UserListView,
          meta: {
            requiresAuth: true,
            title: 'Edit user',
            roles: ['administrator'],
          },
        },
        {
          path: 'users/:id',
          name: 'users.show',
          component: UserShowView,
          meta: {
            requiresAuth: true,
            title: 'User details',
          },
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: {
            requiresAuth: true,
            title: 'My profile',
          },
        },
        {
          path: 'departments',
          name: 'departments.index',
          component: DepartmentListView,
          meta: {
            requiresAuth: true,
            title: 'Departments',
            roles: ['administrator'],
          },
        },
        {
          path: 'job-titles',
          name: 'job-titles.index',
          component: JobTitleListView,
          meta: {
            requiresAuth: true,
            title: 'Job Titles',
            roles: ['administrator'],
          },
        },
        {
          path: 'projects',
          name: 'projects.index',
          component: ProjectListView,
          meta: {
            requiresAuth: true,
            title: 'Projects',
          },
        },
        {
          path: 'projects/create',
          name: 'projects.create',
          component: ProjectListView,
          meta: {
            requiresAuth: true,
            title: 'Create project',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'projects/:id/edit',
          name: 'projects.edit',
          component: ProjectListView,
          meta: {
            requiresAuth: true,
            title: 'Edit project',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'projects/:id',
          name: 'projects.show',
          component: ProjectShowView,
          meta: {
            requiresAuth: true,
            title: 'Project details',
          },
        },
        {
          path: 'tasks',
          name: 'tasks.index',
          component: TaskListView,
          meta: {
            requiresAuth: true,
            title: 'Tasks',
          },
        },
        {
          path: 'tasks/create',
          name: 'tasks.create',
          component: TaskListView,
          meta: {
            requiresAuth: true,
            title: 'Create task',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'tasks/:id/edit',
          name: 'tasks.edit',
          component: TaskListView,
          meta: {
            requiresAuth: true,
            title: 'Edit task',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'tasks/:id',
          name: 'tasks.show',
          component: TaskShowView,
          meta: {
            requiresAuth: true,
            title: 'Task details',
          },
        },
        {
          path: 'activity',
          name: 'activity.index',
          component: ActivityListView,
          meta: {
            requiresAuth: true,
            title: 'Activity',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'notifications',
          name: 'notifications.index',
          component: NotificationListView,
          meta: {
            requiresAuth: true,
            title: 'Notifications',
          },
        },
        {
          path: 'reports',
          redirect: { name: 'reports.projects.index' },
        },
        {
          path: 'reports/projects',
          name: 'reports.projects.index',
          component: ProjectReportsListView,
          meta: {
            requiresAuth: true,
            title: 'Project reports',
          },
        },
        {
          path: 'reports/projects/:id',
          name: 'reports.projects.show',
          component: ProjectReportShowView,
          meta: {
            requiresAuth: true,
            title: 'Project report',
          },
        },
        {
          path: 'reports/employees',
          name: 'reports.employees.index',
          component: EmployeeReportsListView,
          meta: {
            requiresAuth: true,
            title: 'Employee reports',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'reports/employees/:id',
          name: 'reports.employees.show',
          component: EmployeeReportShowView,
          meta: {
            requiresAuth: true,
            title: 'Employee report',
          },
        },
      ],
    },
    {
      path: '/403',
      name: 'forbidden',
      component: ForbiddenView,
      meta: {
        title: 'Forbidden',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        title: 'Not Found',
      },
    },
  ],
})

setupRouterGuards(router)

export default router
