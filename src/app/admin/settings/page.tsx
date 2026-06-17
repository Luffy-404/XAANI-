import { Badge } from '@/components/ui/badge'
import { Bell, CreditCard, Globe2, LockKeyhole, Mail, PackageCheck, Settings, ShieldCheck, Store, Truck } from 'lucide-react'

const settingGroups = [
  {
    title: 'Store Profile',
    description: 'Brand identity and storefront contact details.',
    icon: Store,
    items: ['XAANI storefront', 'hello@xaani.com', 'Premium streetwear catalog'],
  },
  {
    title: 'Checkout',
    description: 'Current payment and fulfillment preferences.',
    icon: CreditCard,
    items: ['Cash on Delivery enabled', 'INR pricing active', 'Secure order capture'],
  },
  {
    title: 'Delivery',
    description: 'Shipping promises shown to customers.',
    icon: Truck,
    items: ['Fast delivery messaging', 'Free shipping badge', 'Stock-aware checkout'],
  },
  {
    title: 'Security',
    description: 'Access controls are managed by the existing auth system.',
    icon: LockKeyhole,
    items: ['NextAuth sessions', 'Admin role protection', 'RBAC middleware'],
  },
]

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1.5">Review store preferences and operational status.</p>
        </div>
        <Badge className="w-fit gap-1.5 border-transparent bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Store healthy
        </Badge>
      </div>

      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Configuration center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              These settings are presented as a polished read-only overview. Editable store controls can be added later without changing the current admin workflow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Globe2, label: 'Currency', value: 'INR' },
              { icon: PackageCheck, label: 'Catalog', value: '100 products' },
              { icon: Mail, label: 'Support', value: 'Active' },
              { icon: Bell, label: 'Alerts', value: 'Ready' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border bg-background/70 p-4">
                <item.icon className="mb-3 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingGroups.map((group) => {
          const Icon = group.icon
          return (
            <section key={group.title} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold">{group.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span>{item}</span>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
