import type { Organization } from '../types'

export interface UseOrganizationsResult {
  organizations: Organization[]
  loading: boolean
}

export function useOrganizations(): UseOrganizationsResult {
  return {
    organizations: [],
    loading: false,
  }
}
