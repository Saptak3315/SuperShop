import { useState } from 'react'
import { useInventory } from '../../hooks/useInventory'
import {
  Plus,
  Search,
  Package,
  AlertCircle,
  PlusCircle,
  X,
} from 'lucide-react'

interface Product {
  id: string
  barcode: string
  name: string
  category: string | null
  unit: string | null
  minStockAlert: number
  totalStock: number
  batches?: {
    id: string
    batchNumber: string
    quantity: number
    expiryDate: string
    costPrice: number
    sellingPrice: number
  }[]
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

export const ProductsPage = () => {
  const {
    products,
    isLoadingProducts,
    createProduct,
    isCreatingProduct,
    createBatch,
    isCreatingBatch,
  } = useInventory() as {
    products: Product[]
    isLoadingProducts: boolean
    createProduct: (data: Record<string, unknown>) => Promise<unknown>
    isCreatingProduct: boolean
    createBatch: (data: Record<string, unknown>) => Promise<unknown>
    isCreatingBatch: boolean
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    barcode: '',
    category: '',
    unit: 'pcs',
    minStockAlert: 10,
  })

  // Batch Form State
  const [batchForm, setBatchForm] = useState({
    batchNumber: '',
    quantity: 1,
    receivedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    costPrice: 0,
    sellingPrice: 0,
  })

  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await createProduct({
        ...productForm,
        minStockAlert: Number(productForm.minStockAlert),
      })
      setSuccessMsg('Product registered successfully!')
      setProductForm({
        name: '',
        barcode: '',
        category: '',
        unit: 'pcs',
        minStockAlert: 10,
      })
      setIsProductModalOpen(false)
    } catch (err) {
      const apiErr = err as ApiError
      setErrorMsg(apiErr.response?.data?.message || 'Failed to register product')
    }
  }

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductForBatch) return
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await createBatch({
        productId: selectedProductForBatch.id,
        batchNumber: batchForm.batchNumber,
        quantity: Number(batchForm.quantity),
        receivedDate: batchForm.receivedDate,
        expiryDate: batchForm.expiryDate,
        costPrice: Number(batchForm.costPrice),
        sellingPrice: Number(batchForm.sellingPrice),
      })
      setSuccessMsg('Batch added successfully!')
      setBatchForm({
        batchNumber: '',
        quantity: 1,
        receivedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        costPrice: 0,
        sellingPrice: 0,
      })
      setSelectedProductForBatch(null)
    } catch (err) {
      const apiErr = err as ApiError
      setErrorMsg(apiErr.response?.data?.message || 'Failed to add batch')
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Header and top controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Products & Stock In</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Register products, check aggregate counts, and inward stock batches.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('')
            setSuccessMsg('')
            setIsProductModalOpen(true)
          }}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors cursor-pointer text-sm"
        >
          <Plus className="h-5 w-5" />
          <span>New Product</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3 max-w-md">
        <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search product by name, barcode, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none placeholder-gray-400 text-gray-900"
        />
      </div>

      {/* Products Table/List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold text-xs border-b border-gray-100">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Stock Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingProducts ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 animate-pulse">
                    Loading products list...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    No registered products found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.totalStock < product.minStockAlert
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 capitalize">
                          Unit: {product.unit || 'pcs'} (Min Alert: {product.minStockAlert})
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{product.barcode}</td>
                      <td className="px-6 py-4">
                        {product.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}
                          >
                            {product.totalStock} {product.unit || 'pcs'}
                          </span>
                          {isLowStock && (
                            <span className="flex items-center text-[10px] text-amber-600 font-semibold mt-1">
                              <AlertCircle className="h-3 w-3 mr-0.5" /> Low Stock Warning
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setErrorMsg('')
                            setSuccessMsg('')
                            setSelectedProductForBatch(product)
                          }}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>Add Batch</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Register New Product</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Fresh Milk 1L"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Barcode *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  placeholder="Scan or enter item barcode"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. Dairy"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Unit Type
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  >
                    <option value="pcs">pcs (pieces)</option>
                    <option value="kg">kg (kilograms)</option>
                    <option value="ltr">ltr (liters)</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Min Stock Alert Threshold
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={productForm.minStockAlert}
                  onChange={(e) =>
                    setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })
                  }
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  {isCreatingProduct ? 'Saving...' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {selectedProductForBatch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50">
              <div>
                <h3 className="text-lg font-bold text-blue-900">Add Stock Batch</h3>
                <p className="text-xs text-blue-700 font-medium mt-0.5">
                  Product: {selectedProductForBatch.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedProductForBatch(null)}
                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    placeholder="e.g. B-01"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Received Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchForm.receivedDate}
                    onChange={(e) => setBatchForm({ ...batchForm, receivedDate: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Cost Price (Per Unit) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={batchForm.costPrice}
                    onChange={(e) => setBatchForm({ ...batchForm, costPrice: Number(e.target.value) })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={batchForm.sellingPrice}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedProductForBatch(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBatch}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  {isCreatingBatch ? 'Saving...' : 'Inward Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
