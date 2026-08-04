import { createRouter, createWebHistory } from 'vue-router'
import GuestLayout from '@/layouts/GuestLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import AppHomeView from '@/views/AppHomeView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
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
      children: [
        {
          path: '',
          name: 'home',
          component: AppHomeView,
          meta: {
            requiresAuth: true,
            title: 'Home',
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
