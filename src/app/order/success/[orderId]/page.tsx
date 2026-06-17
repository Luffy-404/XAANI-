import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const { orderId } = await params
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order || order.userId !== (session.user as any).id) {
    redirect('/profile')
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-lg border p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Order Placed Successfully</h1>
        <p className="text-muted-foreground mb-8">Thank you. Your order has been received.</p>

        <div className="mx-auto max-w-md text-left space-y-3 rounded-lg border p-5 mb-8">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono">#{order.id.slice(-8)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Order Total</span>
            <span className="font-semibold">{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Payment Method</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Order Status</span>
            <span className="capitalize">{order.status}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/#%7B%22page%22%3A%22orders%22%7D"
            className="h-10 px-4 inline-flex items-center justify-center rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            View Orders
          </Link>
          <Link
            href="/shop"
            className="h-10 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}
