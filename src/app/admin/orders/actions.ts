'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = String((session?.user as any)?.role ?? '').toUpperCase()

  if (!session?.user || role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  await requireAdmin()

  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { ok: false, message: 'Invalid order status' }
  }

  await db.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')

  return { ok: true, message: 'Order status updated' }
}
