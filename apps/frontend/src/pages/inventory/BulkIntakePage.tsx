import { useState, useRef, useEffect } from 'react'
import { useInventory } from '../../hooks/useInventory'
import {
  QrCode,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Package,
} from 'lucide-react'

interface Product {
  id: string
  barcode: string
  name: string
  category: string | null
  unit: string | null
  minStockAlert: number
  totalStock: number
}

interface QueuedBatch {
  product: Product
  batchNumber: string
  quantity: number
  receivedDate: string
  expiryDate: string
  costPrice: number
  sellingPrice: number
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

export const BulkIntakePage = () => {
  const { products, createBatchesBulk, isCreatingBatchesBulk } = useInventory() as {
    products: Product[]
    createBatchesBulk: (data: { batches: Record<string, unknown>[] }) => Promise<unknown>
    isCreatingBatchesBulk: boolean
  }

  const [barcodeInput, setBarcodeWithInput] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Current batch being drafted
  const [batchDraft, setBatchDraft] = useState({
    batchNumber: '',
    quantity: 10,
    receivedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    costPrice: 0.0,
    sellingPrice: 0.0,
  })

  const [queue, setQueue] = useState<QueuedBatch[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setSelectedProduct(null)

    if (!barcodeInput.trim()) return

    const product = products.find((p) => p.barcode === barcodeInput.trim())
    if (!product) {
      setErrorMsg(`Product with barcode "${barcodeInput}" not found in inventory.`)
      setBarcodeWithInput('')
      return
    }

    setSelectedProduct(product)
    setBarcodeWithInput('')
  }

  const addToQueue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    if (!batchDraft.batchNumber.trim() || !batchDraft.expiryDate) {
      setErrorMsg('Please complete all required fields (Batch Number & Expiry Date).')
      return
    }

    const newItem: QueuedBatch = {
      product: selectedProduct,
      batchNumber: batchDraft.batchNumber,
      quantity: Number(batchDraft.quantity),
      receivedDate: batchDraft.receivedDate,
      expiryDate: batchDraft.expiryDate,
      costPrice: Number(batchDraft.costPrice),
      sellingPrice: Number(batchDraft.sellingPrice),
    }

    setQueue((prev) => [...prev, newItem])
    setSelectedProduct(null)
    setBatchDraft({
      batchNumber: '',
      quantity: 10,
      receivedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      costPrice: 0.0,
      sellingPrice: 0.0,
    })
    barcodeRef.current?.focus()
  }

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBulkSubmit = async () => {
    setErrorMsg('')
    setSuccessMsg('')

    if (queue.length === 0) {
      setErrorMsg('Bulk intake queue is completely empty!')
      return
    }

    try {
      const payload = {
        batches: queue.map((item) => ({
          productId: item.product.id,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          receivedDate: item.receivedDate,
          expiryDate: item.expiryDate,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
        })),
      }

      await createBatchesBulk(payload)
      setSuccessMsg(`Successfully registered ${queue.length} batches to inventory in bulk!`)
      setQueue([])
    } catch (err) {
      const apiErr = err as ApiError
      setErrorMsg(apiErr.response?.data?.message || 'Failed to submit bulk batches inwarding.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Fast Bulk Intake</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Scan multiple product barcodes and draft batches sequentially to register shipments in bulk.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Flow Steps layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step 1 & 2: Barcode Lookup & Draft Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barcode scan zone */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
              <QrCode className="h-5 w-5 text-blue-600 animate-pulse" />
              <span>Step 1: Scan Product Barcode</span>
            </h3>

            <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan product barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeWithInput(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-gray-900 font-mono tracking-wider"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-sm cursor-pointer transition-colors text-sm"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Draft batch form */}
          {selectedProduct ? (
            <form onSubmit={addToQueue} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  Active Draft
                </span>
                <h3 className="font-bold text-gray-900 mt-2">Step 2: Draft Batch Details</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Product: {selectedProduct.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchDraft.batchNumber}
                    onChange={(e) => setBatchDraft({ ...batchDraft, batchNumber: e.target.value })}
                    placeholder="e.g. B-Bulk-01"
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={batchDraft.quantity}
                    onChange={(e) => setBatchDraft({ ...batchDraft, quantity: Number(e.target.value) })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Received Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchDraft.receivedDate}
                    onChange={(e) => setBatchDraft({ ...batchDraft, receivedDate: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={batchDraft.expiryDate}
                    onChange={(e) => setBatchDraft({ ...batchDraft, expiryDate: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={batchDraft.costPrice}
                    onChange={(e) => setBatchDraft({ ...batchDraft, costPrice: Number(e.target.value) })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={batchDraft.sellingPrice}
                    onChange={(e) => setBatchDraft({ ...batchDraft, sellingPrice: Number(e.target.value) })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer transition-colors text-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Queue Batch</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs">No product scanned yet.</p>
              <p className="text-[10px] text-gray-400 mt-1">Please scan a product's barcode to open draft form.</p>
            </div>
          )}
        </div>

        {/* Step 3: Queued Batches table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-900">Step 3: Bulk shipment queue</h3>
              <p className="text-xs text-gray-500">Drafted items ready to commit to inventory in one transactional request</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-full">
              {queue.length} drafted batches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold text-xs border-b border-gray-100">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Batch No</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Prices</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <Package className="h-8 w-8 mx-auto text-gray-200 mb-1.5" />
                      Bulk intake shipment queue is empty.
                    </td>
                  </tr>
                ) : (
                  queue.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.product.name}</td>
                      <td className="px-4 py-3 font-mono">{item.batchNumber}</td>
                      <td className="px-4 py-3 font-bold">{item.quantity}</td>
                      <td className="px-4 py-3 font-medium text-gray-600">{item.expiryDate}</td>
                      <td className="px-4 py-3 text-gray-500">
                        C: ${item.costPrice.toFixed(2)} / S: ${item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              onClick={handleBulkSubmit}
              disabled={isCreatingBatchesBulk || queue.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md cursor-pointer transition-all flex items-center space-x-2"
            >
              {isCreatingBatchesBulk ? (
                <span>Registering Bulk Batches...</span>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Commit Bulk Shipment Inwarding</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
