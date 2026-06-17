'use client'

import React from 'react'
import { useRouter } from '@/lib/router'
import { Store, Mail, MapPin, Phone } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  const { navigate } = useRouter()

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="flex items-center gap-2 mb-4 transition-opacity hover:opacity-80"
            >
              <div className="flex h-6 w-6 items-center justify-center bg-foreground text-background shrink-0">
                <span className="text-[10px] font-black">X</span>
              </div>
              <span className="text-lg font-black tracking-[0.12em] uppercase">XAANI</span>
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Premium streetwear inspired by discipline, individuality, and self-expression.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-tight">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', page: { page: 'home' as const } },
                { label: 'Shop All', page: { page: 'shop' as const } },
                { label: 'My Cart', page: { page: 'cart' as const } },
                { label: 'My Orders', page: { page: 'orders' as const } },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.page)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-tight">Categories</h3>
            <ul className="space-y-2.5">
              {['Men', 'Streetwear', 'Hoodies', 'Jackets'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => navigate({ page: 'shop', category: cat.toLowerCase().replace(' ', '-') })}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-tight">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                24 Atelier Road, Fashion District, Mumbai 400001
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                hello@xaani.com
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} XAANI. All rights reserved.</p>
          <div className="flex gap-4">
            <button className="transition-colors hover:text-foreground">Privacy Policy</button>
            <button className="transition-colors hover:text-foreground">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
