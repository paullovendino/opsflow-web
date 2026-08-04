import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guest?: boolean
    title?: string
    roles?: Array<'administrator' | 'project_manager' | 'employee'>
  }
}

export {}
