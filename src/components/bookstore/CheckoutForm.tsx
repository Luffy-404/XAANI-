'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from '@/lib/router'
import { useCart } from '@/lib/cart'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, ArrowLeft, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const checkoutSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  zip: z.string().min(3, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  paymentMethod: z.literal('COD'),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutForm() {
  const { navigate, goBack } = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      paymentMethod: 'COD',
    },
  })

  const onSubmit = async (data: CheckoutForm) => {
    if (!session?.user) {
      toast.error('Please sign in to checkout')
      navigate({ page: 'login' })
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map((item) => ({ bookId: item.bookId, quantity: item.quantity })),
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        toast.error(result.error || 'Failed to place order')
        return
      }

      const order = await res.json()
      await clearCart()
      toast.success('Order placed successfully!')
      window.location.href = `/order/success/${order.id}`
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Please sign in</h2>
        <p className="text-muted-foreground mt-2">You need to be logged in to checkout.</p>
        <Button className="mt-4" onClick={() => navigate({ page: 'login' })}>
          Sign In
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">Add some products before checking out.</p>
        <Button className="mt-4" onClick={() => navigate({ page: 'shop' })}>
          Browse Shop
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="mb-6 gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    {...form.register('address')}
                  />
                  {form.formState.errors.address && (
                    <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      {...form.register('city')}
                    />
                    {form.formState.errors.city && (
                      <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      {...form.register('state')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP / Postal Code</Label>
                    <Input
                      id="zip"
                      placeholder="10001"
                      {...form.register('zip')}
                    />
                    {form.formState.errors.zip && (
                      <p className="text-xs text-destructive">{form.formState.errors.zip.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      {...form.register('country')}
                    />
                    {form.formState.errors.country && (
                      <p className="text-xs text-destructive">{form.formState.errors.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h2 className="text-lg font-semibold mb-3">Payment Method</h2>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="COD" {...form.register('paymentMethod')} />
                    Cash On Delivery (COD)
                  </label>
                </div>

                <Button type="submit" className="w-full mt-6" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Place Order
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="border-border/50 sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const price = item.book.discountPrice || item.book.price
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-12 w-9 shrink-0 rounded bg-muted overflow-hidden">
                      <img
                        src={item.book.image}
                        alt={item.book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.book.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                )
              })}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span>COD</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
