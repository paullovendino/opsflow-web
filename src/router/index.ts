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
import ProjectCreateView from '@/modules/projects/views/ProjectCreateView.vue'
import ProjectEditView from '@/modules/projects/views/ProjectEditView.vue'
import ProjectShowView from '@/modules/projects/views/ProjectShowView.vue'
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
          component: ProjectCreateView,
          meta: {
            requiresAuth: true,
            title: 'Create project',
            roles: ['administrator', 'project_manager'],
          },
        },
        {
          path: 'projects/:id/edit',
          name: 'projects.edit',
          component: ProjectEditView,
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
