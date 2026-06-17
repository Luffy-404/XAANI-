'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from '@/lib/router'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const bookSchema = z.object({
  title: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  author: z.string().min(1, 'Brand is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().min(1, 'Price is required'),
  discountPrice: z.string().optional(),
  stock: z.string().min(1, 'Stock is required'),
  image: z.string().min(1, 'Image URL is required'),
  categoryId: z.string().min(1, 'Category is required'),
  featured: z.boolean().optional(),
  rating: z.string().optional(),
})

type BookForm = z.infer<typeof bookSchema>

interface AdminBookFormProps {
  bookId?: string
}

export default function AdminBookForm({ bookId }: AdminBookFormProps) {
  const { navigate, goBack } = useRouter()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingBook, setIsLoadingBook] = useState(!!bookId)

  const form = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      slug: '',
      author: '',
      description: '',
      price: '',
      discountPrice: '',
      stock: '0',
      image: '',
      categoryId: '',
      featured: false,
      rating: '0',
    },
  })

  const watchTitle = form.watch('title')

  // Auto-generate slug from title
  useEffect(() => {
    if (!bookId && watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      form.setValue('slug', slug)
    }
  }, [watchTitle, bookId, form])

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {})
  }, [])

  // Fetch existing book for editing
  useEffect(() => {
    if (!bookId) return
    fetch(`/api/books/${bookId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found')
        return res.json()
      })
      .then((book) => {
        form.reset({
          title: book.title,
          slug: book.slug,
          author: book.author,
          description: book.description,
          price: book.price.toString(),
          discountPrice: book.discountPrice?.toString() || '',
          stock: book.stock.toString(),
          image: book.image,
          categoryId: book.categoryId,
          featured: book.featured,
          rating: book.rating?.toString() || '0',
        })
      })
      .catch(() => {
        toast.error('Failed to load product')
      })
      .finally(() => setIsLoadingBook(false))
  }, [bookId, form])

  const onSubmit = async (data: BookForm) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
        stock: parseInt(data.stock),
        rating: parseFloat(data.rating || '0'),
      }

      const url = bookId ? `/api/books/${bookId}` : '/api/books'
      const method = bookId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const result = await res.json()
        toast.error(result.error || `Failed to ${bookId ? 'update' : 'create'} product`)
        return
      }

      toast.success(`Product ${bookId ? 'updated' : 'created'} successfully!`)
      navigate({ page: 'admin-books' })
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingBook) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8"
    >
      <Button variant="ghost" size="sm" onClick={goBack} className="mb-6 gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mb-8">
        {bookId ? 'Edit Product' : 'Add New Product'}
      </h1>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Name</Label>
                <Input
                  id="title"
                  placeholder="Product name"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="product-slug"
                  {...form.register('slug')}
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Brand</Label>
              <Input
                id="author"
                placeholder="Brand name"
                {...form.register('author')}
              />
              {form.formState.errors.author && (
                <p className="text-xs text-destructive">{form.formState.errors.author.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Product description"
                rows={4}
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Price & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="24.99"
                  {...form.register('price')}
                />
                {form.formState.errors.price && (
                  <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPrice">Discount Price (₹)</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  step="0.01"
                  placeholder="19.99 (optional)"
                  {...form.register('discountPrice')}
                />
              </div>
            </div>

            {/* Stock & Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  {...form.register('stock')}
                />
                {form.formState.errors.stock && (
                  <p className="text-xs text-destructive">{form.formState.errors.stock.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="4.5"
                  {...form.register('rating')}
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                placeholder="/images/placeholders/product-placeholder.svg"
                {...form.register('image')}
              />
              {form.formState.errors.image && (
                <p className="text-xs text-destructive">{form.formState.errors.image.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(value) => form.setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.watch('featured')}
                onCheckedChange={(checked) => form.setValue('featured', checked)}
              />
              <Label>Featured Product</Label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {bookId ? 'Update Product' : 'Create Product'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
