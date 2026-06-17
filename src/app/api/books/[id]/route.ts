import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function serializeBook(book: any) {
  return {
    ...book,
    image: book.image || book.imageUrl,
    imageUrl: book.imageUrl || book.image,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by slug first, then by id
    const book = await db.book.findFirst({
      where: {
        OR: [{ slug: id }, { id }],
      },
      include: { category: true },
    })

    if (!book) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(serializeBook(book))
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existingBook = await db.book.findUnique({ where: { id } })
    if (!existingBook) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const updateData: any = {}
    const allowedFields = ['title', 'author', 'description', 'price', 'discountPrice', 'stock', 'image', 'imageUrl', 'categoryId', 'featured', 'published', 'rating', 'slug']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['price', 'discountPrice', 'rating'].includes(field)) {
          updateData[field] = body[field] ? parseFloat(body[field]) : null
        } else if (field === 'stock') {
          updateData[field] = parseInt(body[field]) || 0
        } else if (field === 'featured' || field === 'published') {
          updateData[field] = Boolean(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    if (body.imageUrl !== undefined && body.image === undefined) {
      updateData.image = body.imageUrl
    }

    if (body.image !== undefined && body.imageUrl === undefined) {
      updateData.imageUrl = body.image
    }

    const book = await db.book.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json(serializeBook(book))
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 })
    }
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingBook = await db.book.findUnique({ where: { id } })
    if (!existingBook) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db.book.delete({ where: { id } })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
