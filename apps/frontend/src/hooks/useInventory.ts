import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export const useInventory = () => {
  const queryClient = useQueryClient()

  // Products
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory/products')
      return data
    },
  })

  const createProductMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/api/inventory/products', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.put(`/api/inventory/products/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] })
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/inventory/products/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] })
    },
  })

  // Batches
  const createBatchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/api/inventory/batches', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['expiring-batches'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] })
    },
  })

  const createBatchesBulkMutation = useMutation({
    mutationFn: async (data: { batches: Record<string, unknown>[] }) => {
      const response = await api.post('/api/inventory/batches/bulk', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['expiring-batches'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-chart'] })
    },
  })

  const expiringBatchesQuery = useQuery({
    queryKey: ['expiring-batches'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory/batches/expiring')
      return data
    },
  })

  return {
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    createProduct: createProductMutation.mutateAsync,
    isCreatingProduct: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutateAsync,
    isUpdatingProduct: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutateAsync,
    isDeletingProduct: deleteProductMutation.isPending,
    createBatch: createBatchMutation.mutateAsync,
    isCreatingBatch: createBatchMutation.isPending,
    createBatchesBulk: createBatchesBulkMutation.mutateAsync,
    isCreatingBatchesBulk: createBatchesBulkMutation.isPending,
    expiringBatches: expiringBatchesQuery.data || [],
    isLoadingExpiring: expiringBatchesQuery.isLoading,
  }
}
