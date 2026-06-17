import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function serializeBook(book: any) {
  return {
    ...book,
    image: book.image || book.imageUrl,
    imageUrl: book.imageUrl || book.image,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (category === 'men') {
      where.author = 'XAANI'
    } else if (category) {
      where.category = { slug: category }
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    const published = searchParams.get('published')
    if (published === 'true') {
      where.published = true
    } else if (published === 'false') {
      where.published = false
    } else if (published !== 'all') {
      where.published = true
    }

    const [books, total] = await Promise.all([
      db.book.findMany({
        where,
        include: { category: true },
        orderBy: { [sort]: order === 'desc' ? 'desc' : 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.book.count({ where }),
    ])

    return NextResponse.json({
      books: books.map(serializeBook),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Books fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, author, description, price, discountPrice, stock, image, imageUrl, categoryId, featured, published, rating, slug } = body

    if (!title || !author || !description || !price || !categoryId || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const book = await db.book.create({
      data: {
        title,
        author,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock) || 0,
        image: image || imageUrl || '/images/placeholders/product-placeholder.svg',
        imageUrl: imageUrl || image || '/images/placeholders/product-placeholder.svg',
        categoryId,
        featured: featured || false,
        published: published ?? true,
        rating: parseFloat(rating) || 0,
        slug,
      },
      include: { category: true },
    })

    return NextResponse.json(serializeBook(book), { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 })
    }
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
