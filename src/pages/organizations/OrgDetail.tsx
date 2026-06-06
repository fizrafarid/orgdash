import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, RefreshCw, UserPlus } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganizations'
import { useMembers, useInviteMember } from '@/hooks/useMembers'
import { InviteMemberSchema, type InviteMemberValues } from '@/schemas'
import { useToast } from '@/hooks/use-toast'
import type { OrgType, OrgMember } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// ── Constants ──────────────────────────────────────────────────────────────

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  school: 'School',
  nonprofit: 'Nonprofit',
  business: 'Business',
  government: 'Government',
  startup: 'Startup',
}

const ORG_TYPE_COLORS: Record<OrgType, string> = {
  school: 'bg-blue-100 text-blue-800 border-blue-200',
  nonprofit: 'bg-green-100 text-green-800 border-green-200',
  business: 'bg-purple-100 text-purple-800 border-purple-200',
  government: 'bg-orange-100 text-orange-800 border-orange-200',
  startup: 'bg-pink-100 text-pink-800 border-pink-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrgMember['status'] }) {
  if (status === 'active') {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
        Active
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
      Invited
    </Badge>
  )
}

// ── Invite Member Dialog ─────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
}

function InviteMemberDialog({ open, onOpenChange, orgId }: InviteDialogProps) {
  const { toast } = useToast()
  const invite = useInviteMember()

  const form = useForm<InviteMemberValues>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: { email: '' },
  })

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
      invite.reset()
    }
    onOpenChange(isOpen)
  }

  const onSubmit = async (values: InviteMemberValues) => {
    try {
      await invite.mutateAsync({ organization_id: orgId, email: values.email })
      handleOpenChange(false)
      toast({ title: 'Invitation sent' })
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="member@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending…' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Members table ────────────────────────────────────────────────────────────

function MembersTable({ orgId, onInvite }: { orgId: string; onInvite: () => void }) {
  const { data: members, isLoading, isError, refetch } = useMembers(orgId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center space-y-3">
        <p className="text-sm font-medium text-destructive">Failed to load members.</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    )
  }

  if (!members?.length) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          No members yet. Invite someone to get started.
        </p>
        <Button size="sm" onClick={onInvite}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Email</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Role</th>
            <th className="pb-2 font-medium">Invited</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b last:border-0">
              <td className="py-3 pr-4 font-medium">{member.email}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={member.status} />
              </td>
              <td className="py-3 pr-4 capitalize text-muted-foreground">{member.role}</td>
              <td className="py-3 text-muted-foreground">{formatDate(member.invited_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrgDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inviteOpen, setInviteOpen] = useState(false)
  const { data: org, isLoading, isError, refetch } = useOrganization(id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/organizations')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Organizations
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">Failed to load organization.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const conditionalField = (() => {
    if (org.type === 'school' && org.school_district) {
      return { label: 'School District', value: org.school_district }
    }
    if (org.type === 'nonprofit' && org.nonprofit_ein) {
      return { label: 'EIN', value: org.nonprofit_ein }
    }
    if (org.type === 'business' && org.business_reg_number) {
      return { label: 'Registration Number', value: org.business_reg_number }
    }
    return null
  })()

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/organizations')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Organizations
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <Badge variant="outline" className={ORG_TYPE_COLORS[org.type]}>
            {ORG_TYPE_LABELS[org.type]}
          </Badge>
        </div>
        {conditionalField && (
          <p className="text-sm text-muted-foreground">
            {conditionalField.label}:{' '}
            <span className="text-gray-700">{conditionalField.value}</span>
          </p>
        )}
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Members</CardTitle>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent>
          <MembersTable orgId={org.id} onInvite={() => setInviteOpen(true)} />
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} orgId={org.id} />
    </div>
  )
}
