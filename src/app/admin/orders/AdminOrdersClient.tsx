'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Package, MapPin, CreditCard, User, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, orderStatusStyles } from '@/lib/utils'
import { updateOrderStatusAction } from './actions'

type AdminOrder = {
  id: string
  total: number
  status: string
  paymentMethod: string
  address: string
  city: string
  state: string | null
  zip: string
  country: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  items: Array<{
    id: string
    title: string
    author: string
    quantity: number
    price: number
    image: string
  }>
}

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrdersClient({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter()
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(orders[0] || null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function updateStatus(orderId: string, status: string) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status)
      setMessage(result.message)
      if (result.ok) {
        setSelectedOrder((order) => order ? { ...order, status } : order)
        router.refresh()
      }
    })
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1.5">View orders and manage fulfillment status.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Order ID</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`border-t cursor-pointer transition-colors hover:bg-accent/50 ${selectedOrder?.id === order.id ? 'bg-accent/40' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs">#{order.id.slice(-8)}</td>
                  <td className="px-4 py-3 font-medium">{order.user.name || 'Customer'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.user.email}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border-transparent capitalize ${orderStatusStyles(order.status)}`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.paymentMethod}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-foreground">No orders yet</p>
                    <p className="text-sm mt-1">Orders will appear here once customers start checking out.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-xl border bg-card p-5 h-fit lg:sticky lg:top-6">
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Order Details</h2>
                  <p className="text-sm text-muted-foreground font-mono">#{selectedOrder.id.slice(-8)}</p>
                </div>
                <Badge className={`border-transparent capitalize ${orderStatusStyles(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Customer
                </h3>
                <p className="text-sm font-medium">{selectedOrder.user.name || 'Customer'}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.user.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Shipping Address
                </h3>
                <p className="text-sm">{selectedOrder.address}</p>
                <p className="text-sm">{selectedOrder.city}, {selectedOrder.state || ''} {selectedOrder.zip}</p>
                <p className="text-sm">{selectedOrder.country}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5" /> Ordered Products
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payment Method</span>
                  <span className="text-foreground">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
              </div>

              <div>
                <label className="text-sm font-semibold">Update Status</label>
                <select
                  value={selectedOrder.status}
                  disabled={isPending}
                  onChange={(event) => updateStatus(selectedOrder.id, event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize disabled:opacity-50"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Select an order to view details.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
