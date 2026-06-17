import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (String(userRole).toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalBooks,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      recentOrders,
      lowStockBooks,
    ] = await Promise.all([
      db.book.count(),
      db.order.count(),
      db.user.count(),
      db.order.aggregate({ _sum: { total: true } }),
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'delivered' } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      db.book.findMany({
        where: { stock: { lt: 10 } },
        take: 5,
        orderBy: { stock: 'asc' },
      }),
    ])

    return NextResponse.json({
      totalBooks,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      deliveredOrders,
      recentOrders,
      lowStockBooks,
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
