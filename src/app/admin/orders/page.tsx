import AdminOrdersClient from './AdminOrdersClient'
import { db } from '@/lib/db'

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AdminOrdersClient
      orders={orders.map((order) => ({
        id: order.id,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        address: order.address,
        city: order.city,
        state: order.state,
        zip: order.zip,
        country: order.country,
        createdAt: order.createdAt.toISOString(),
        user: {
          name: order.user.name,
          email: order.user.email,
        },
        items: order.items.map((item) => ({
          id: item.id,
          title: item.title,
          author: item.author,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      }))}
    />
  )
}
