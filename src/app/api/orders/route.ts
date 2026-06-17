import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const PAYMENT_METHODS = ['COD'] as const
type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = String((session.user as any).role).toUpperCase()

    let orders
    if (userRole === 'ADMIN') {
      orders = await db.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      orders = await db.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { address, city, state, zip, country, items, paymentMethod = 'COD' } = await req.json()

    if (!address || !city || !zip || !country) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const postedItems = Array.isArray(items)
      ? items
          .map((item) => ({
            bookId: String(item.bookId || ''),
            quantity: Math.max(1, parseInt(String(item.quantity || '1'), 10) || 1),
          }))
          .filter((item) => item.bookId)
      : []

    const cartItems = postedItems.length > 0
      ? await Promise.all(
          postedItems.map(async (item) => {
            const book = await db.book.findUnique({ where: { id: item.bookId } })
            return book ? { bookId: item.bookId, quantity: item.quantity, book } : null
          })
        ).then((result) => result.filter((item): item is NonNullable<typeof item> => item !== null))
      : await db.cartItem.findMany({
          where: { userId },
          include: { book: true },
        })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const missingBooks = postedItems.length > 0 && cartItems.length !== postedItems.length
    if (missingBooks) {
      return NextResponse.json({ error: 'One or more books are no longer available' }, { status: 400 })
    }

    const outOfStockItem = cartItems.find((item) => item.quantity > item.book.stock)
    if (outOfStockItem) {
      return NextResponse.json(
        { error: `Not enough stock for ${outOfStockItem.book.title}` },
        { status: 400 }
      )
    }

    // Calculate total
    let total = 0
    const orderItems = cartItems.map((item) => {
      const price = item.book.discountPrice || item.book.price
      total += price * item.quantity
      return {
        bookId: item.bookId,
        quantity: item.quantity,
        price,
        title: item.book.title,
        author: item.book.author,
        image: item.book.image || item.book.imageUrl,
      }
    })

    // Create order
    const order = await db.order.create({
      data: {
        userId,
        total,
        status: 'pending',
        paymentMethod,
        address,
        city,
        state: state || null,
        zip,
        country,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    })

    // Update stock
    for (const item of cartItems) {
      await db.book.update({
        where: { id: item.bookId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    await db.cartItem.deleteMany({ where: { userId } })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
