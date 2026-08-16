import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export const useAuth = () => {
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/api/auth/me')
        return data.user
      } catch {
        return null
      }
    },
    staleTime: Infinity,
  })

  const registerMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/api/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user)
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/api/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
    },
  })

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
  }
}
