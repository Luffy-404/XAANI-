'use client'

import { useMemo, useState, useTransition } from 'react'
import { Plus, Search, Pencil, Trash2, Star, X, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  createBookAction,
  deleteBookAction,
  toggleBookFeaturedAction,
  toggleBookPublishedAction,
  updateBookAction,
  type BookActionState,
} from './actions'

type CategoryOption = {
  id: string
  name: string
  slug: string
}

type AdminBook = {
  id: string
  title: string
  slug: string
  author: string
  description: string
  categoryId: string
  category: CategoryOption
  price: number
  discountPrice: number | null
  stock: number
  imageUrl: string
  featured: boolean
  published: boolean
  createdAt: string
  updatedAt: string
}

const emptyState: BookActionState = { ok: true, message: '' }

function generatedSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function BooksManagementClient({
  books,
  categories,
}: {
  books: AdminBook[]
  categories: CategoryOption[]
}) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [featured, setFeatured] = useState('all')
  const [published, setPublished] = useState('all')
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [state, setState] = useState<BookActionState>(emptyState)
  const [isPending, startTransition] = useTransition()

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      const matchesCategory = categoryId === 'all' || book.categoryId === categoryId
      const matchesFeatured =
        featured === 'all' || book.featured === (featured === 'true')
      const matchesPublished =
        published === 'all' || book.published === (published === 'true')

      return matchesSearch && matchesCategory && matchesFeatured && matchesPublished
    })
  }, [books, categoryId, featured, published, search])

  function openAddForm() {
    setEditingBook(null)
    setState(emptyState)
    setFormOpen(true)
  }

  function openEditForm(book: AdminBook) {
    setEditingBook(book)
    setState(emptyState)
    setFormOpen(true)
  }

  function submitForm(formData: FormData) {
    startTransition(async () => {
      const result = editingBook
        ? await updateBookAction(emptyState, formData)
        : await createBookAction(emptyState, formData)

      setState(result)

      if (result.ok) {
        setFormOpen(false)
      }
    })
  }

  function runQuickAction(action: () => Promise<BookActionState>) {
    startTransition(async () => {
      setState(await action())
    })
  }

  function deleteBook(book: AdminBook) {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) {
      return
    }

    runQuickAction(() => deleteBookAction(book.id))
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground mt-1.5">Manage fashion products, visibility, and inventory.</p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {state.message && (
        <div
          className={`mb-4 rounded-md border px-3 py-2 text-sm ${
            state.ok
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or brand"
            className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={featured}
          onChange={(event) => setFeatured(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Featured: All</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
        <select
          value={published}
          onChange={(event) => setPublished(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Status: All</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Image</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Brand</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Featured</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => (
              <tr key={book.id} className="border-t transition-colors hover:bg-accent/40">
                <td className="px-4 py-3">
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="h-16 w-11 rounded object-cover shadow-sm ring-1 ring-border"
                  />
                </td>
                <td className="px-4 py-3 max-w-55">
                  <div className="font-medium truncate">{book.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{book.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{book.author}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-normal">
                    {book.category?.name || 'Uncategorized'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{formatCurrency(book.price)}</div>
                  {book.discountPrice && (
                    <div className="text-xs text-muted-foreground">
                      Sale {formatCurrency(book.discountPrice)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={book.stock === 0 ? 'text-destructive font-medium' : book.stock <= 5 ? 'text-amber-600 font-medium dark:text-amber-400' : ''}>
                    {book.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={isPending}
                    onClick={() => runQuickAction(() => toggleBookFeaturedAction(book.id))}
                    className="disabled:opacity-50"
                  >
                    {book.featured ? (
                      <Badge className="gap-1 border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground hover:bg-accent">
                        <Star className="h-3 w-3" />
                        No
                      </Badge>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={isPending}
                    onClick={() => runQuickAction(() => toggleBookPublishedAction(book.id))}
                    className="disabled:opacity-50"
                  >
                    {book.published ? (
                      <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-400">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="hover:bg-secondary/80">
                        Draft
                      </Badge>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => openEditForm(book)}
                      title="Edit product"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => deleteBook(book)}
                      title="Delete product"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBooks.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-foreground">No products found</p>
                  <p className="text-sm mt-1">No products match the current filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <BookForm
          book={editingBook}
          categories={categories}
          isPending={isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={submitForm}
        />
      )}
    </main>
  )
}

function BookForm({
  book,
  categories,
  isPending,
  onClose,
  onSubmit,
}: {
  book: AdminBook | null
  categories: CategoryOption[]
  isPending: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [title, setTitle] = useState(book?.title || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold">{book ? 'Edit Product' : 'Add Product'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Slug: <span className="font-mono">{generatedSlug(title) || 'generated-from-title'}</span>
            </p>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {book && <input type="hidden" name="id" value={book.id} />}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name</label>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <input
              name="author"
              defaultValue={book?.author || ''}
              required
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              defaultValue={book?.description || ''}
              required
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              name="categoryId"
              defaultValue={book?.categoryId || categories[0]?.id || ''}
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <input
              name="imageUrl"
              type="url"
              defaultValue={book?.imageUrl || ''}
              required
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={book?.price ?? ''}
              required
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Discount Price</label>
            <input
              name="discountPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={book?.discountPrice ?? ''}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={book?.stock ?? 0}
              required
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-4 pt-7">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="featured" type="checkbox" defaultChecked={book?.featured || false} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="published" type="checkbox" defaultChecked={book?.published ?? true} />
              Published
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 mt-2 border-t md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              type="submit"
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving...' : book ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
