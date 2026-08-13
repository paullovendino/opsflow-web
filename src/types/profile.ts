import type { ActivityLog } from '@/types/activity'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface ProfileUser {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
  avatar: string | null
  status: string
  last_login_at: string | null
  theme_preference: ThemePreference | string
  notify_task_assigned: boolean
  notify_task_status: boolean
  notify_remarks: boolean
  notify_mentions: boolean
  role?: { id: number; name: string; description: string | null } | null
  department?: { id: number; name: string } | null
  job_title?: { id: number; name: string } | null
}

export interface ProfileProjectsSummary {
  owned_count: number
  member_count: number
}

export interface ProfileTasksSummary {
  assigned_open: number
  assigned_overdue: number
}

export interface ProfileSummary {
  user: ProfileUser
  projects: ProfileProjectsSummary
  tasks: ProfileTasksSummary
  recent_activity: ActivityLog[]
}

export interface ProfileUpdatePayload {
  first_name?: string
  middle_name?: string | null
  last_name?: string
  password?: string
  password_confirmation?: string
  theme_preference?: ThemePreference
  notify_task_assigned?: boolean
  notify_task_status?: boolean
  notify_remarks?: boolean
  notify_mentions?: boolean
}

export const THEME_PREFERENCE_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]
