'use client'

import React from 'react'
import { useRouter } from '@/lib/router'
import { useCart, CartItemData } from '@/lib/cart'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { navigate } = useRouter()
  const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart()

  const handleRemove = async (item: CartItemData) => {
    try {
      await removeItem(item.id)
      toast.success(`Removed "${item.book.title}" from cart`)
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    try {
      await updateQuantity(itemId, quantity)
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Browse our collection and add some products
              </p>
            </div>
            <Button
              onClick={() => {
                navigate({ page: 'shop' })
                onOpenChange(false)
              }}
            >
              Browse Shop
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
              {items.map((item) => {
                const effectivePrice = item.book.discountPrice || item.book.price
                return (
                  <div key={item.id} className="flex gap-3">
                    {/* Book Image */}
                    <div
                      className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted cursor-pointer"
                      onClick={() => {
                        navigate({ page: 'book', slug: item.book.slug })
                        onOpenChange(false)
                      }}
                    >
                      <img
                        src={item.book.image}
                        alt={item.book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-tight line-clamp-1">
                        {item.book.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.book.author}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.book.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {formatCurrency(effectivePrice * item.quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Separator />

            {/* Cart Summary */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold">{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout</p>
              <SheetFooter className="flex flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    navigate({ page: 'checkout' })
                    onOpenChange(false)
                  }}
                >
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate({ page: 'shop' })
                    onOpenChange(false)
                  }}
                >
                  Continue Shopping
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
