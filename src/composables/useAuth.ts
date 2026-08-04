import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const auth = useAuthStore()
  const { user, isAuthenticated, isBootstrapped, isLoading, fullName, email, roleName } = storeToRefs(auth)

  return {
    user,
    isAuthenticated,
    isBootstrapped,
    isLoading,
    fullName,
    email,
    roleName,
    bootstrap: auth.bootstrap,
    refreshUser: auth.refreshUser,
    login: auth.login,
    logout: auth.logout,
    setUser: auth.setUser,
    clear: auth.clear,
  }
}
