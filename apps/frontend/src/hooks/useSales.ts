import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export const useSales = () => {
  const queryClient = useQueryClient()

  const checkoutMutation = useMutation({
    mutationFn: async (data: {
      paymentMethod: 'CASH' | 'CARD' | 'MFS'
      items: { productId: string; quantity: number }[]
    }) => {
      const response = await api.post('/api/sales/checkout', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] })
      queryClient.invalidateQueries({ queryKey: ['expiring-batches'] })
    },
  })

  return {
    checkout: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
  }
}
