'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const bookSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Product name is required'),
  author: z.string().trim().min(1, 'Brand is required'),
  description: z.string().trim().min(1, 'Description is required'),
  categoryId: z.string().trim().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  discountPrice: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.number().positive().optional()
  ),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().trim().url('Image URL must be valid'),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(false),
})

export type BookActionState = {
  ok: boolean
  message: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = String((session?.user as any)?.role ?? '').toUpperCase()

  if (!session?.user || role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
}

async function uniqueSlug(title: string, currentBookId?: string) {
  const baseSlug = slugify(title) || 'product'
  let slug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await db.book.findUnique({ where: { slug } })

    if (!existing || existing.id === currentBookId) {
      return slug
    }

    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }
}

function parseBookForm(formData: FormData) {
  return bookSchema.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    author: formData.get('author'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    price: formData.get('price'),
    discountPrice: formData.get('discountPrice'),
    stock: formData.get('stock'),
    imageUrl: formData.get('imageUrl'),
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
  })
}

export async function createBookAction(
  _state: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  try {
    await requireAdmin()

    const parsed = parseBookForm(formData)
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message || 'Invalid product data' }
    }

    const data = parsed.data
    const slug = await uniqueSlug(data.title)

    await db.book.create({
      data: {
        title: data.title,
        slug,
        author: data.author,
        description: data.description,
        categoryId: data.categoryId,
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        stock: data.stock,
        image: data.imageUrl,
        imageUrl: data.imageUrl,
        featured: data.featured,
        published: data.published,
      },
    })

    revalidatePath('/admin/books')
    revalidatePath('/shop')

    return { ok: true, message: 'Product created' }
  } catch (error) {
    console.error('Create product error:', error)
    return { ok: false, message: 'Failed to create product' }
  }
}

export async function updateBookAction(
  _state: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  try {
    await requireAdmin()

    const parsed = parseBookForm(formData)
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message || 'Invalid product data' }
    }

    const data = parsed.data
    if (!data.id) {
      return { ok: false, message: 'Product ID is required' }
    }

    const slug = await uniqueSlug(data.title, data.id)

    await db.book.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug,
        author: data.author,
        description: data.description,
        categoryId: data.categoryId,
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        stock: data.stock,
        image: data.imageUrl,
        imageUrl: data.imageUrl,
        featured: data.featured,
        published: data.published,
      },
    })

    revalidatePath('/admin/books')
    revalidatePath('/shop')

    return { ok: true, message: 'Product updated' }
  } catch (error) {
    console.error('Update product error:', error)
    return { ok: false, message: 'Failed to update product' }
  }
}

export async function deleteBookAction(id: string): Promise<BookActionState> {
  try {
    await requireAdmin()

    await db.book.delete({ where: { id } })

    revalidatePath('/admin/books')
    revalidatePath('/shop')

    return { ok: true, message: 'Product deleted' }
  } catch (error) {
    console.error('Delete product error:', error)
    return { ok: false, message: 'Failed to delete product' }
  }
}

export async function toggleBookFeaturedAction(id: string): Promise<BookActionState> {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id }, select: { featured: true } })
    if (!book) {
      return { ok: false, message: 'Product not found' }
    }

    await db.book.update({ where: { id }, data: { featured: !book.featured } })

    revalidatePath('/admin/books')
    revalidatePath('/shop')

    return { ok: true, message: 'Featured status updated' }
  } catch (error) {
    console.error('Toggle featured error:', error)
    return { ok: false, message: 'Failed to update featured status' }
  }
}

export async function toggleBookPublishedAction(id: string): Promise<BookActionState> {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id }, select: { published: true } })
    if (!book) {
      return { ok: false, message: 'Product not found' }
    }

    await db.book.update({ where: { id }, data: { published: !book.published } })

    revalidatePath('/admin/books')
    revalidatePath('/shop')

    return { ok: true, message: 'Published status updated' }
  } catch (error) {
    console.error('Toggle published error:', error)
    return { ok: false, message: 'Failed to update published status' }
  }
}
