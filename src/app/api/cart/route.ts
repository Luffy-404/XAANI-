import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const cartItems = await db.cartItem.findMany({
      where: { userId },
      include: { book: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(cartItems)
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { bookId, quantity } = await req.json()

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Check if book exists and has stock
    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.stock < 1) {
      return NextResponse.json({ error: 'Book is out of stock' }, { status: 400 })
    }

    // Upsert cart item
    const existingItem = await db.cartItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + (quantity || 1)
      if (newQuantity > book.stock) {
        return NextResponse.json({ error: 'Not enough stock' }, { status: 400 })
      }
      const updated = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { book: true },
      })
      return NextResponse.json(updated)
    }

    const cartItem = await db.cartItem.create({
      data: {
        userId,
        bookId,
        quantity: quantity || 1,
      },
      include: { book: true },
    })

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error('Cart add error:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    await db.cartItem.deleteMany({ where: { userId } })

    return NextResponse.json({ message: 'Cart cleared' })
  } catch (error) {
    console.error('Cart clear error:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
