import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { quantity } = await req.json()

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    }

    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: { book: true },
    })

    if (!cartItem || cartItem.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (quantity > cartItem.book.stock) {
      return NextResponse.json({ error: 'Not enough stock' }, { status: 400 })
    }

    const updated = await db.cartItem.update({
      where: { id },
      data: { quantity },
      include: { book: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Cart update error:', error)
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const cartItem = await db.cartItem.findUnique({ where: { id } })

    if (!cartItem || cartItem.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    await db.cartItem.delete({ where: { id } })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Cart delete error:', error)
    return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 })
  }
}
