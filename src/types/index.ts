export type OrgType = 'school' | 'nonprofit' | 'business' | 'government' | 'startup'

export interface Organization {
  id: string
  name: string
  type: OrgType
  created_by: string
  created_at: string
  school_district?: string
  nonprofit_ein?: string
  business_reg_number?: string
}

export interface OrgMember {
  id: string
  organization_id: string
  user_id: string | null
  email: string
  status: 'invited' | 'active'
  role: 'admin' | 'member'
  invited_at: string
  joined_at?: string | null
}

export interface Profile {
  id: string
  full_name: string
  is_admin: boolean
}
