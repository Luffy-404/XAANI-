'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface CartItemData {
  id: string
  bookId: string
  quantity: number
  book: {
    id: string
    title: string
    author: string
    price: number
    discountPrice: number | null
    image: string
    stock: number
    slug: string
  }
}

interface CartContextType {
  items: CartItemData[]
  isLoading: boolean
  addItem: (bookId: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: number
  totalPrice: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

export function CartProvider({ children, isLoggedIn }: { children: React.ReactNode; isLoggedIn: boolean }) {
  const [items, setItems] = useState<CartItemData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load cart from localStorage for guests
  useEffect(() => {
    if (!isLoggedIn) {
      const saved = localStorage.getItem('guest-cart')
      if (saved) {
        try {
          setItems(JSON.parse(saved))
        } catch {
          localStorage.removeItem('guest-cart')
        }
      }
    }
  }, [isLoggedIn])

  // Sync guest cart to localStorage
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem('guest-cart', JSON.stringify(items))
    }
  }, [items, isLoggedIn])

  // Fetch cart from DB if logged in
  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn) {
      refreshCart()
    }
  }, [isLoggedIn, refreshCart])

  const addItem = useCallback(async (bookId: string, quantity = 1) => {
    if (isLoggedIn) {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId, quantity }),
        })
        if (res.ok) {
          await refreshCart()
        }
      } catch (error) {
        console.error('Failed to add to cart:', error)
      }
    } else {
      // For guests, fetch book data and add to local cart
      try {
        const res = await fetch(`/api/books/${bookId}`)
        if (res.ok) {
          const book = await res.json()
          const existingIndex = items.findIndex((item) => item.bookId === bookId)
          if (existingIndex >= 0) {
            const newItems = [...items]
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            }
            setItems(newItems)
          } else {
            setItems((prev) => [
              ...prev,
              {
                id: `guest-${Date.now()}`,
                bookId: book.id,
                quantity,
                book: {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  price: book.price,
                  discountPrice: book.discountPrice,
                  image: book.image,
                  stock: book.stock,
                  slug: book.slug,
                },
              },
            ])
          }
        }
      } catch (error) {
        console.error('Failed to add to guest cart:', error)
      }
    }
  }, [isLoggedIn, items, refreshCart])

  const removeItem = useCallback(async (itemId: string) => {
    if (isLoggedIn) {
      try {
        const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
        if (res.ok) {
          await refreshCart()
        }
      } catch (error) {
        console.error('Failed to remove from cart:', error)
      }
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId))
    }
  }, [isLoggedIn, refreshCart])

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    if (isLoggedIn) {
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        })
        if (res.ok) {
          await refreshCart()
        }
      } catch (error) {
        console.error('Failed to update cart:', error)
      }
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      )
    }
  }, [isLoggedIn, refreshCart])

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
        await fetch('/api/cart', { method: 'DELETE' })
        setItems([])
      } catch (error) {
        console.error('Failed to clear cart:', error)
      }
    } else {
      setItems([])
    }
  }, [isLoggedIn])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.book.discountPrice || item.book.price) * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
