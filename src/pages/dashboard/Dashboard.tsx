import { Link } from 'react-router-dom'
import { Building2, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: organizations = [] } = useOrganizations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total organizations</p>
          </CardContent>
        </Card>
      </div>

      <Button asChild>
        <Link to="/organizations">
          <Building2 className="mr-2 h-4 w-4" />
          Manage Organizations
        </Link>
      </Button>
    </div>
  )
}
