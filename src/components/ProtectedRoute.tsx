import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute() {
  const { user, profile, isLoading, signOut } = useAuth()

  // Sign out if a logged-in user somehow lacks admin access
  useEffect(() => {
    if (!isLoading && profile !== null && !profile.is_admin) {
      void signOut()
    }
  }, [isLoading, profile, signOut])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />
  }

  if (profile !== null && !profile.is_admin) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
