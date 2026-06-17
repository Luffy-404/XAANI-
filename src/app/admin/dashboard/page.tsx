import { db } from '@/lib/db'
import { Package, Clock, CheckCircle2, DollarSign, Users, Store, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const [totalUsers, totalBooks, totalOrders, pendingOrders, deliveredOrders, revenue] = await Promise.all([
    db.user.count(),
    db.book.count(),
    db.order.count(),
    db.order.count({ where: { status: 'pending' } }),
    db.order.count({ where: { status: 'delivered' } }),
    db.order.aggregate({
      where: { status: { not: 'cancelled' } },
      _sum: { total: true },
    }),
  ])

  const statCards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: Package,
      iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    },
    {
      title: 'Delivered Orders',
      value: deliveredOrders,
      icon: CheckCircle2,
      iconClass: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    },
    {
      title: 'Revenue',
      value: formatCurrency(revenue._sum.total || 0),
      icon: DollarSign,
      iconClass: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1.5">Overview of XAANI store activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.title} className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-3xl font-bold tracking-tight mt-2">{s.value}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">System Overview</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Registered Users</span>
              </div>
              <span className="text-lg font-semibold">{totalUsers}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Store className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Products in Catalog</span>
              </div>
              <span className="text-lg font-semibold">{totalBooks}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="space-y-1">
            {[
              { href: '/admin/books', label: 'Manage Products', icon: Store },
              { href: '/admin/orders', label: 'Manage Orders', icon: Package },
              { href: '/admin/users', label: 'Manage Users', icon: Users },
            ].map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
