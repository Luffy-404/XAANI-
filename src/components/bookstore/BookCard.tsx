'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from '@/lib/router'
import { useCart } from '@/lib/cart'
import { useSession } from 'next-auth/react'
import { ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface BookCardProps {
  book: {
    id: string
    title: string
    slug: string
    author: string
    price: number
    discountPrice: number | null
    image: string
    rating: number
    stock: number
    category?: { id: string; name: string; slug: string }
  }
}

export default function BookCard({ book }: BookCardProps) {
  const { navigate } = useRouter()
  const { addItem } = useCart()
  const { data: session } = useSession()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session?.user) {
      toast.error('Please sign in to add items to your cart')
      navigate({ page: 'login' })
      return
    }
    try {
      await addItem(book.id, 1)
      toast.success(`"${book.title}" added to cart`)
    } catch {
      toast.error('Failed to add item to cart')
    }
  }

  const effectivePrice = book.discountPrice || book.price
  const hasDiscount = book.discountPrice && book.discountPrice < book.price
  const discountPercent = hasDiscount
    ? Math.round(((book.price - book.discountPrice!) / book.price) * 100)
    : 0

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <div
        className="group cursor-pointer overflow-hidden rounded-2xl border bg-card/95 p-3 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
        onClick={() => navigate({ page: 'book', slug: book.slug })}
      >
        {/* Product Image */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-inner ring-1 ring-border/70">
          <img
            src={book.image}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{discountPercent}%
            </span>
          )}
          {book.stock === 0 && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-sm font-medium bg-background px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="pt-3 space-y-1.5">
          {book.category && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{book.category.name}</span>
          )}
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground">{book.author}</p>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(book.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{book.rating.toFixed(1)}</span>
          </div>

          {/* Price & Cart */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold">{formatCurrency(effectivePrice)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">{formatCurrency(book.price)}</span>
              )}
            </div>
            <button
              className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              onClick={handleAddToCart}
              disabled={book.stock === 0}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
