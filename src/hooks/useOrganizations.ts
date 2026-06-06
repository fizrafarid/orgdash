import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Organization } from '@/types'
import type { CreateOrgValues } from '@/schemas'

export interface OrganizationWithCount extends Organization {
  member_count: number
}

async function fetchOrganizations(userId: string): Promise<OrganizationWithCount[]> {
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!orgs?.length) return []

  const typedOrgs = orgs as Organization[]

  const { data: memberRows, error: countError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .in('organization_id', typedOrgs.map((o) => o.id))

  if (countError) throw countError

  const countMap = (memberRows as { organization_id: string }[] | null ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.organization_id] = (acc[row.organization_id] ?? 0) + 1
      return acc
    },
    {},
  )

  return typedOrgs.map((org) => ({ ...org, member_count: countMap[org.id] ?? 0 }))
}

export function useOrganizations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => {
      if (!user) throw new Error('Not authenticated')
      return fetchOrganizations(user.id)
    },
    enabled: !!user,
  })
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Organization
    },
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: CreateOrgValues): Promise<Organization> => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: values.name,
          type: values.type,
          created_by: user.id,
          school_district: values.type === 'school' ? (values.school_district ?? null) : null,
          nonprofit_ein: values.type === 'nonprofit' ? (values.nonprofit_ein ?? null) : null,
          business_reg_number: values.type === 'business' ? (values.business_reg_number ?? null) : null,
        })
        .select()
        .single()
      if (error) throw error
      return data as Organization
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })
}
