export interface LookupItem {
  id: number
  name: string
  code?: string
  description?: string | null
  status?: string
  department_id?: number | null
}

export interface RoleLookupItem {
  id: number
  name: string
  description: string | null
}
