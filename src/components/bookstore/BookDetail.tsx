'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from '@/lib/router'
import { useCart } from '@/lib/cart'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, ShoppingCart, Star, ArrowLeft, Package, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import BookCard from './BookCard'
import { formatCurrency } from '@/lib/utils'

interface BookDetailProps {
  slug: string
}

export default function BookDetail({ slug }: BookDetailProps) {
  const { navigate, goBack } = useRouter()
  const { addItem } = useCart()
  const { data: session } = useSession()
  const [book, setBook] = useState<any>(null)
  const [relatedBooks, setRelatedBooks] = useState<any[]>([])
  const [fetchedSlug, setFetchedSlug] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const isLoading = fetchedSlug !== slug

  useEffect(() => {
    let cancelled = false
    fetch(`/api/books/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Book not found')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setBook(data)
        setFetchedSlug(slug)
        // Fetch related books from same category
        if (data.category?.slug) {
          fetch(`/api/books?category=${data.category.slug}&limit=4`)
            .then((res) => res.json())
            .then((result) => {
              if (!cancelled) {
                setRelatedBooks(
                  (result.books || []).filter((b: any) => b.id !== data.id)
                )
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBook(null)
          setFetchedSlug(slug)
        }
      })
    return () => { cancelled = true }
  }, [slug])

  const handleAddToCart = async () => {
    if (!session?.user) {
      toast.error('Please sign in to add items to your cart')
      navigate({ page: 'login' })
      return
    }
    try {
      await addItem(book.id, quantity)
      toast.success(`Added "${book.title}" to cart`)
    } catch {
      toast.error('Failed to add item to cart')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Product not found</h2>
        <p className="text-muted-foreground mt-2">The product you are looking for does not exist.</p>
        <Button className="mt-4" onClick={() => navigate({ page: 'shop' })}>
          Browse Shop
        </Button>
      </div>
    )
  }

  const effectivePrice = book.discountPrice || book.price
  const hasDiscount = book.discountPrice && book.discountPrice < book.price
  const discountPercent = hasDiscount
    ? Math.round(((book.price - book.discountPrice) / book.price) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={goBack} className="mb-6 gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Book Cover */}
        <div className="relative">
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-md">
            <img
              src={book.image}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          </div>
          {hasDiscount && (
            <Badge className="absolute top-4 left-4 bg-destructive text-white text-sm font-bold">
              -{discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Book Info */}
        <div className="flex flex-col">
          {book.category && (
            <Badge variant="outline" className="w-fit mb-3 text-xs font-medium">
              {book.category.name}
            </Badge>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{book.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">{book.author}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(book.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {book.rating.toFixed(1)} out of 5
            </span>
          </div>

          <Separator className="my-6" />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCurrency(effectivePrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(book.price)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Save {formatCurrency(book.price - book.discountPrice)}
                </Badge>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 mt-4">
            {book.stock > 10 ? (
              <>
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">In Stock</span>
              </>
            ) : book.stock > 0 ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-600 font-medium">
                  Only {book.stock} left in stock
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {book.description}
            </p>
          </div>

          <Separator className="my-6" />

          {/* Add to Cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                disabled={quantity >= book.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1 gap-2"
              size="lg"
              onClick={handleAddToCart}
              disabled={book.stock === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {relatedBooks.map((relatedBook: any) => (
              <BookCard key={relatedBook.id} book={relatedBook} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
