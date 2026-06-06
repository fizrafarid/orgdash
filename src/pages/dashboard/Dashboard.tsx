import { Link } from 'react-router-dom'
import { Building2, LayoutDashboard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: organizations, isLoading, isError, refetch } = useOrganizations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <LayoutDashboard className="h-6 w-6" />
          Dashboard
        </h1>
        <p className="mt-1 text-gray-500">Welcome back, {user?.email}</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">Failed to load dashboard data.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations?.length ?? 0}</div>
              <p className="mt-1 text-xs text-muted-foreground">Total organizations</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Button asChild>
        <Link to="/organizations">
          <Building2 className="mr-2 h-4 w-4" />
          Manage Organizations
        </Link>
      </Button>
    </div>
  )
}
