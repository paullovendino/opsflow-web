export type UserStatus = 'active' | 'inactive'

export type RoleName = 'administrator' | 'project_manager' | 'employee'

export interface AuthRole {
  id: number
  name: RoleName | string
  description: string | null
}

export interface AuthLookup {
  id: number
  name: string
  code?: string
  description?: string | null
}

export interface AuthUser {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
  avatar: string | null
  status: UserStatus | string
  last_login_at: string | null
  role?: AuthRole | null
  department?: AuthLookup | null
  job_title?: AuthLookup | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginData {
  user: AuthUser
}
