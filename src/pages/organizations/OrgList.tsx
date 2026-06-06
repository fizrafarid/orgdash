import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Plus, RefreshCw } from 'lucide-react'
import { useCreateOrganization, useOrganizations, type OrganizationWithCount } from '@/hooks/useOrganizations'
import { CreateOrgSchema, type CreateOrgValues } from '@/schemas'
import { useToast } from '@/hooks/use-toast'
import type { OrgType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

// ── Constants ──────────────────────────────────────────────────────────────

const ORG_TYPE_OPTIONS: Array<{ value: OrgType; label: string }> = [
  { value: 'school', label: 'School' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'business', label: 'Business' },
  { value: 'government', label: 'Government' },
  { value: 'startup', label: 'Startup' },
]

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

// ── OrgCard ─────────────────────────────────────────────────────────────────

function OrgCard({ org }: { org: OrganizationWithCount }) {
  const navigate = useNavigate()
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/organizations/${org.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug">{org.name}</CardTitle>
          <Badge variant="outline" className={ORG_TYPE_COLORS[org.type]}>
            {ORG_TYPE_LABELS[org.type]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
        <p>{org.member_count} {org.member_count === 1 ? 'member' : 'members'}</p>
        <p>{formatDate(org.created_at)}</p>
      </CardContent>
    </Card>
  )
}

// ── OrgCard Skeleton ─────────────────────────────────────────────────────────

function OrgCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  )
}

// ── Create Org Dialog ────────────────────────────────────────────────────────

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const { toast } = useToast()
  const createOrg = useCreateOrganization()

  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(CreateOrgSchema),
    defaultValues: {
      name: '',
      type: 'school',
      school_district: '',
      nonprofit_ein: '',
      business_reg_number: '',
    },
  })

  const orgType = form.watch('type')

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
      createOrg.reset()
    }
    onOpenChange(isOpen)
  }

  const onSubmit = async (values: CreateOrgValues) => {
    try {
      await createOrg.mutateAsync(values)
      handleOpenChange(false)
      toast({ title: 'Organization created successfully' })
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
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>

        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Riverside Academy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORG_TYPE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional: school */}
            {orgType === 'school' && (
              <FormField
                control={form.control}
                name="school_district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School district</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Los Angeles Unified School District" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Conditional: nonprofit */}
            {orgType === 'nonprofit' && (
              <FormField
                control={form.control}
                name="nonprofit_ein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EIN</FormLabel>
                    <FormControl>
                      <Input placeholder="12-3456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Conditional: business */}
            {orgType === 'business' && (
              <FormField
                control={form.control}
                name="business_reg_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business registration number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. C1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrgList() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: orgs, isLoading, isError, refetch } = useOrganizations()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Organizations
        </h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      <CreateOrgDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrgCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12 space-y-4">
          <p className="text-destructive font-medium">Failed to load organizations.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && orgs?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No organizations yet</h3>
            <p className="text-muted-foreground mt-1">Get started by creating your first organization.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && orgs && orgs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  )
}
