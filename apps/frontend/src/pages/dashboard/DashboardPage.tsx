import { useState } from 'react'
import { useDashboard } from '../../hooks/useDashboard'
import { useInventory } from '../../hooks/useInventory'
import {
  Package,
  Layers,
  AlertTriangle,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react'

interface ChartItem {
  date: string
  quantity: number
  count: number
}

interface BatchItem {
  id: string
  batchNumber: string
  quantity: number
  expiryDate: string
  product?: {
    name: string
    unit: string
  }
}

export const DashboardPage = () => {
  const { summary, chartData, isLoadingSummary, isLoadingChart } = useDashboard()
  const [expiringDays, setExpiringDays] = useState<number>(7)
  const { expiringBatches, isLoadingExpiring } = useInventory() as {
    expiringBatches: BatchItem[]
    isLoadingExpiring: boolean
  }

  // Find hover state for custom SVG chart
  const [hoveredBar, setHoveredBar] = useState<{
    date: string
    quantity: number
    count: number
    x: number
    y: number
  } | null>(null)

  // Status badging based on days left
  const getExpirationBadge = (expiryDateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDateStr)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
          Expired ({Math.abs(diffDays)}d ago)
        </span>
      )
    } else if (diffDays <= 7) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-100 animate-pulse">
          Critical ({diffDays}d left)
        </span>
      )
    } else if (diffDays <= 30) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
          Warning ({diffDays}d left)
        </span>
      )
    } else {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-100">
          Safe ({diffDays}d left)
        </span>
      )
    }
  }

  // Find max quantity in chart data for scaling
  const maxQty = chartData.length > 0 ? Math.max(...(chartData as ChartItem[]).map((d) => d.quantity)) : 0
  const chartHeight = 220
  const chartWidth = 700

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Executive Dashboard</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Real-time metrics, stock warning system, and expiration timeline controls.
        </p>
      </div>

      {/* Summary Cards */}
      {isLoadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Products */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:border-blue-100 transition-all duration-200 hover:shadow-md">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.totalProducts}</h3>
            </div>
          </div>

          {/* Total Batches */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:border-indigo-100 transition-all duration-200 hover:shadow-md">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Batches</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.totalBatches}</h3>
            </div>
          </div>

          {/* Low Stock Warnings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:border-amber-100 transition-all duration-200 hover:shadow-md">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock Warnings</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.lowStockWarnings}</h3>
            </div>
          </div>

          {/* Critical Expiring Batches */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:border-red-100 transition-all duration-200 hover:shadow-md">
            <div className="p-3.5 bg-red-50 text-red-600 rounded-xl">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expiring (≤ 7 Days)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.criticalExpiringBatches}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Expiration Timeline Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Expiration Timeline</h3>
                <p className="text-xs text-gray-500">Volume of active stock expiring in the next 6 months</p>
              </div>
              <div className="flex items-center space-x-2 text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-medium border border-gray-100">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Active Stock Expiry Chart</span>
              </div>
            </div>

            {isLoadingChart ? (
              <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
            ) : chartData.length === 0 ? (
              <div className="h-64 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm">No upcoming batch expirations registered.</p>
              </div>
            ) : (
              <div className="relative pt-6">
                {/* SVG Bar Chart */}
                <div className="overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
                    className="w-full min-w-[500px]"
                    height={chartHeight + 40}
                  >
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                      <line
                        key={idx}
                        x1="30"
                        y1={chartHeight * (1 - ratio) + 10}
                        x2={chartWidth - 10}
                        y2={chartHeight * (1 - ratio) + 10}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Bars */}
                    {(chartData as ChartItem[]).map((d, i) => {
                      const barWidth = Math.max(12, (chartWidth - 50) / chartData.length - 8)
                      const gap = 8
                      const x = 40 + i * (barWidth + gap)
                      const barHeight = maxQty > 0 ? (d.quantity / maxQty) * chartHeight : 0
                      const y = chartHeight - barHeight + 10

                      return (
                        <g key={d.date}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(barHeight, 4)}
                            rx="4"
                            className="fill-blue-500 hover:fill-blue-600 transition-colors cursor-pointer"
                            onMouseEnter={() => {
                              setHoveredBar({
                                date: d.date,
                                quantity: d.quantity,
                                count: d.count,
                                x: x + barWidth / 2,
                                y: y - 10,
                              })
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                        </g>
                      )
                    })}

                    {/* X Axis Date labels (Limit to first, middle, last to avoid crowding) */}
                    {chartData.length > 0 && (
                      <>
                        <text x="40" y={chartHeight + 25} fontSize="10" fill="#94a3b8" textAnchor="start">
                          {chartData[0].date}
                        </text>
                        {chartData.length > 2 && (
                          <text
                            x={chartWidth / 2}
                            y={chartHeight + 25}
                            fontSize="10"
                            fill="#94a3b8"
                            textAnchor="middle"
                          >
                            {chartData[Math.floor(chartData.length / 2)].date}
                          </text>
                        )}
                        <text
                          x={chartWidth - 10}
                          y={chartHeight + 25}
                          fontSize="10"
                          fill="#94a3b8"
                          textAnchor="end"
                        >
                          {chartData[chartData.length - 1].date}
                        </text>
                      </>
                    )}

                    {/* Axis Lines */}
                    <line x1="30" y1="10" x2="30" y2={chartHeight + 10} stroke="#cbd5e1" strokeWidth="1" />
                    <line
                      x1="30"
                      y1={chartHeight + 10}
                      x2={chartWidth - 10}
                      y2={chartHeight + 10}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />

                    {/* Left Axis Max Labels */}
                    <text x="25" y="15" fontSize="9" fill="#94a3b8" textAnchor="end">
                      {maxQty}
                    </text>
                    <text x="25" y={chartHeight / 2 + 10} fontSize="9" fill="#94a3b8" textAnchor="end">
                      {Math.round(maxQty / 2)}
                    </text>
                    <text x="25" y={chartHeight + 10} fontSize="9" fill="#94a3b8" textAnchor="end">
                      0
                    </text>
                  </svg>
                </div>

                {/* Tooltip Overlay */}
                {hoveredBar && (
                  <div
                    className="absolute bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl pointer-events-none border border-slate-800"
                    style={{
                      left: `${(hoveredBar.x / chartWidth) * 100}%`,
                      top: `${(hoveredBar.y / (chartHeight + 40)) * 100}%`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <p className="font-bold border-b border-slate-800 pb-1 mb-1">{hoveredBar.date}</p>
                    <p>Qty: {hoveredBar.quantity} units</p>
                    <p>Batches: {hoveredBar.count}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500 font-medium">Hover over any bar to inspect date & volume.</span>
          </div>
        </div>

        {/* Urgent Expiration list / Filter controls */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Urgent Expirations</h3>
              <p className="text-xs text-gray-500">Items nearing expiration based on selected range</p>
            </div>
            <select
              value={expiringDays}
              onChange={(e) => setExpiringDays(Number(e.target.value))}
              className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-lg outline-none hover:bg-gray-100 cursor-pointer"
            >
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[250px] pr-1">
            {isLoadingExpiring ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse p-3 bg-gray-50 rounded-xl" />
              ))
            ) : expiringBatches.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-gray-400">
                <Clock className="h-8 w-8 text-gray-300 mb-1.5" />
                <p className="text-xs text-center">No batches expiring in next {expiringDays} days.</p>
              </div>
            ) : (
              expiringBatches
                .filter((b) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const exp = new Date(b.expiryDate)
                  const diffTime = exp.getTime() - today.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  return diffDays <= expiringDays
                })
                .map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {batch.product?.name || 'Unknown Product'}
                      </p>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500 mt-1">
                        <span className="font-medium bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">
                          Batch: {batch.batchNumber}
                        </span>
                        <span>•</span>
                        <span>Stock: {batch.quantity}</span>
                      </div>
                    </div>
                    <div>{getExpirationBadge(batch.expiryDate)}</div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Urgent Expiration Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Urgent Expirations Monitor</h3>
            <p className="text-xs text-gray-500">Complete monitoring log for all active stock expirations.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold text-xs border-b border-gray-100">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Batch Number</th>
                <th className="px-6 py-4">Quantity Remaining</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Expirations Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingExpiring ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 animate-pulse">
                    Loading critical inventory alerts...
                  </td>
                </tr>
              ) : expiringBatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Clock className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    No active stock expirations alerts triggered.
                  </td>
                </tr>
              ) : (
                expiringBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {batch.product?.name || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{batch.batchNumber}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {batch.quantity} <span className="text-gray-400 text-xs">{batch.product?.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{batch.expiryDate}</td>
                    <td className="px-6 py-4">{getExpirationBadge(batch.expiryDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
