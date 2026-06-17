'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Store,
  LayoutDashboard,
  Library,
  Package,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/books', label: 'Products', icon: Library },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background md:block">
      <aside className="border-b bg-card/80 md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-screen md:w-72 md:border-b-0 md:border-r p-4 md:p-5 md:flex md:flex-col md:overflow-y-auto">
        <div className="flex items-center gap-3 rounded-xl border bg-background/70 px-3 py-3 mb-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center bg-foreground text-background shadow-sm">
            <span className="text-sm font-black">X</span>
          </div>
          <div>
            <div className="font-semibold leading-tight tracking-wide">XAANI</div>
            <div className="text-xs text-muted-foreground leading-tight">Admin Panel</div>
          </div>
        </div>
        <nav className="space-y-1 md:flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="mt-6 flex w-full items-center gap-2.5 rounded-lg border bg-background/70 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>
      <div className="min-w-0 md:pl-72">{children}</div>
    </div>
  )
}
