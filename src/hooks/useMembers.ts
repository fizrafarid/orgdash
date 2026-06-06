import type { OrgMember } from '../types'

export interface UseMembersResult {
  members: OrgMember[]
  loading: boolean
}

export function useMembers(_organizationId?: string): UseMembersResult {
  return {
    members: [],
    loading: false,
  }
}
