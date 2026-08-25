import { useState, useRef, useEffect } from 'react'
import { useInventory } from '../../hooks/useInventory'
import { useSales } from '../../hooks/useSales'
import {
  Search,
  ShoppingCart,
  Trash2,
  CreditCard,
  QrCode,
  DollarSign,
  AlertTriangle,
  Minus,
  Plus,
  CheckCircle,
  FileText,
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

interface CartItem {
  product: Product
  quantity: number
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

export const POSPage = () => {
  const { products, isLoadingProducts } = useInventory() as {
    products: Product[]
    isLoadingProducts: boolean
  }
  const { checkout, isCheckingOut } = useSales()

  interface SaleResponse {
    invoiceNo: string
    totalAmount: number
  }

  interface ProductExtended extends Product {
    batches?: {
      sellingPrice: number
    }[]
  }

  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeWithInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MFS'>('CASH')

  const [successOrder, setSuccessOrder] = useState<SaleResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  // Auto-focus barcode input for instant scan-to-checkout workflow
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  // Handle barcode scanner / enter submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessOrder(null)

    if (!barcodeInput.trim()) return

    const product = products.find((p) => p.barcode === barcodeInput.trim())
    if (!product) {
      setErrorMsg(`Product with barcode "${barcodeInput}" not found in inventory.`)
      setBarcodeWithInput('')
      return
    }

    addToCart(product)
    setBarcodeWithInput('')
  }

  const addToCart = (product: Product) => {
    setErrorMsg('')
    setSuccessOrder(null)

    if (product.totalStock <= 0) {
      setErrorMsg(`Cannot add "${product.name}". This product has absolutely no active stock remaining.`)
      return
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.totalStock) {
          setErrorMsg(`Insufficient stock! Cannot exceed total available stock of ${product.totalStock} ${product.unit || 'pcs'}.`)
          return prevCart
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMsg('')
    if (newQty <= 0) {
      removeFromCart(productId)
      return
    }

    const item = cart.find((i) => i.product.id === productId)
    if (!item) return

    if (newQty > item.product.totalStock) {
      setErrorMsg(`Insufficient stock! Cannot exceed total available stock of ${item.product.totalStock} ${item.product.unit || 'pcs'}.`)
      return
    }

    setCart((prevCart) =>
      prevCart.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i))
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.product.id !== productId))
  }

  const calculateTotal = () => {
    // Note: Since products listed might not show their precise price (as prices are in batches),
    // let's assume we can query average/first batch selling price or default to a reasonable value.
    // In our Products model we do not have direct selling price but inside Batch we do!
    // Wait, let's look at what prices our products have.
    // Actually, let's fetch batch selling price or if not found, let's look at the product batches.
    // Let's check how `products` are fetched. `listProducts` preloads `batches` where status is ACTIVE and quantity > 0!
    // Oh, yes! `listProducts` returns product JSON which includes the `batches` array!
    // Let's verify `batches` inside products:
    // Yes:
    // ```
    // .preload('batches', (query) => {
    //   query.where('status', 'ACTIVE').where('quantity', '>', 0)
    // })
    // ```
    // This is perfect! Let's get the price from the first active batch of the product.
    // If no batch exists, we can default the price to 0 or say "No active batches" and not allow checkout!
    // This is extremely smart and accurate!
    return cart.reduce((sum, item) => {
      const activeBatches = (item.product as ProductExtended).batches || []
      const price = Number(activeBatches[0]?.sellingPrice || 0)
      return sum + price * item.quantity
    }, 0)
  }

  const getProductPrice = (product: Product) => {
    const activeBatches = (product as ProductExtended).batches || []
    return Number(activeBatches[0]?.sellingPrice || 0)
  }

  const handleCheckout = async () => {
    setErrorMsg('')
    setSuccessOrder(null)

    if (cart.length === 0) {
      setErrorMsg('POS checkout cart is empty!')
      return
    }

    try {
      const payload = {
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }

      const orderResult = await checkout(payload)
      setSuccessOrder(orderResult)
      setCart([])
    } catch (err) {
      const apiErr = err as ApiError
      setErrorMsg(apiErr.response?.data?.message || 'Transactional checkout checkout failed due to insufficient stock or database error.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Point of Sale (POS)</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Enforce First-Expired, First-Out (FEFO) stock deduction and database locking in checkout.
        </p>
      </div>

      {/* Notifications */}
      {successOrder && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-950 text-base">Checkout Processed Successfully!</h3>
              <p className="text-xs text-green-800 mt-1 font-mono">Invoice No: {successOrder.invoiceNo}</p>
              <p className="text-xs text-green-800 font-medium">Total Amount Deducted: ${Number(successOrder.totalAmount).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Print Invoice Receipt</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Checkout Area grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Product Discovery & Scanner */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanner Input */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <QrCode className="h-5 w-5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-gray-900">Continuous Scanner Input</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                Live Auto-Focus Enabled
              </span>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan or enter barcode number, then press enter..."
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

          {/* Touch-click Product Selection Grid */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-500" />
              <span>Selectable Active Stock</span>
            </h3>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-50 rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                <ShoppingCart className="h-10 w-10 mx-auto text-gray-200 mb-2" />
                <p className="text-sm">No active stock in inventory. Please add batches first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                {products.map((product) => {
                  const hasStock = product.totalStock > 0
                  const activePrice = getProductPrice(product)
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={!hasStock}
                      className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                        hasStock
                          ? 'bg-gray-50/50 hover:bg-blue-50/30 border-gray-150 hover:border-blue-200 cursor-pointer'
                          : 'bg-gray-100/50 border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-gray-900 truncate text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate font-mono">Barcode: {product.barcode}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-white text-gray-700 border border-gray-200">
                          Stock: {product.totalStock} {product.unit}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-blue-600 text-base">${activePrice.toFixed(2)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Cart & Total Payment controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              <span>Checkout Cart</span>
            </h3>
            <span className="text-xs bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-full">
              {cart.length} unique items
            </span>
          </div>

          {/* Cart item display list */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="h-10 w-10 mx-auto text-gray-200 mb-2" />
                <p className="text-xs">Your cart is currently empty.</p>
                <p className="text-[10px] text-gray-400 mt-1">Scan barcode or tap a product to stock up!</p>
              </div>
            ) : (
              cart.map((item) => {
                const price = getProductPrice(item.product)
                const subtotal = price * item.quantity
                return (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-gray-900 truncate text-xs">{item.product.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Price: ${price.toFixed(2)}</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">${subtotal.toFixed(2)}</p>
                    </div>

                    {/* Quantity Selector controls */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-900 font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Payment Method selectors */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('MFS')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'MFS'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>MFS / Mobile</span>
              </button>
            </div>
          </div>

          {/* Invoice Summary and Checkout Submit */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Subtotal Amount</span>
              <span className="text-sm font-bold text-gray-900">${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-3">
              <span className="text-base font-extrabold text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-blue-600">${calculateTotal().toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-extrabold text-sm shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              {isCheckingOut ? (
                <span>Deducting FEFO Stock...</span>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Execute POS Checkout</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
