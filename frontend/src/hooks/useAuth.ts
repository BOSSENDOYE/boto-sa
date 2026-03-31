import { useQuery } from '@tanstack/react-query'
import { getMe } from '../lib/auth'
import { isAuthenticated } from '../lib/auth'
import type { User } from '../lib/types'

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return { user, isLoading }
}

export function useIsAdmin(user: User | undefined) {
  return user?.role === 'SUPER_ADMIN'
}

export function useIsDoctor(user: User | undefined) {
  return user?.role === 'DOCTOR' || user?.role === 'SUPER_ADMIN'
}
