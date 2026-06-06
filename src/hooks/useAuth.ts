import type { Profile } from '../types'

export interface AuthState {
  user: Profile | null
  loading: boolean
}

export function useAuth(): AuthState {
  return {
    user: null,
    loading: false,
  }
}
