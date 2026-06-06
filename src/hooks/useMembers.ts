import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { INVITE_FUNCTION_URL } from '@/lib/constants'
import type { OrgMember } from '@/types'

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: ['members', orgId],
    queryFn: async (): Promise<OrgMember[]> => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .order('invited_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OrgMember[]
    },
    enabled: !!orgId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { organization_id: string; email: string }): Promise<OrgMember> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(INVITE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(vars),
      })

      const payload = await res.json() as Record<string, unknown>
      if (!res.ok) {
        throw new Error((payload.error as string | undefined) ?? 'Failed to send invitation')
      }
      return payload as unknown as OrgMember
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['members', vars.organization_id] })
    },
  })
}
