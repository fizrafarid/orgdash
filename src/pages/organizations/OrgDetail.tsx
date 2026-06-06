import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganization } from '@/hooks/useOrganizations'

export default function OrgDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: org, isLoading, isError } = useOrganization(id ?? '')

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !org) {
    return <p className="text-destructive">Failed to load organization.</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Members management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
