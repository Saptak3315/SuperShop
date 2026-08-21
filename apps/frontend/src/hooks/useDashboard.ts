import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export const useDashboard = () => {
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/summary')
      return data
    },
  })

  const chartQuery = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/expiring-chart')
      return data
    },
  })

  return {
    summary: summaryQuery.data || {
      totalProducts: 0,
      totalBatches: 0,
      lowStockWarnings: 0,
      criticalExpiringBatches: 0,
    },
    isLoadingSummary: summaryQuery.isLoading,
    chartData: chartQuery.data || [],
    isLoadingChart: chartQuery.isLoading,
  }
}
