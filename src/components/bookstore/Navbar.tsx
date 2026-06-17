'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from '@/lib/router'
import { useCart } from '@/lib/cart'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Store,
  ShoppingCart,
  Search,
  Menu,
  Sun,
  Moon,
  User,
  LogOut,
  Package,
  LayoutDashboard,
  ChevronDown,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Navbar() {
  const { route, navigate } = useRouter()
  const { totalItems } = useCart()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setCategories(data))
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({ page: 'shop', search: searchQuery.trim() })
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const isAdmin = String((session?.user as any)?.role).toUpperCase() === 'ADMIN'

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
          : 'bg-background/50 backdrop-blur-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate({ page: 'home' })}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center bg-foreground text-background shrink-0">
              <span className="text-[11px] font-black">X</span>
            </div>
            <span className="text-xl font-black tracking-[0.12em] uppercase">XAANI</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={route.page === 'home' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => navigate({ page: 'home' })}
              className="text-sm font-medium"
            >
              Home
            </Button>
            <Button
              variant={route.page === 'shop' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => navigate({ page: 'shop' })}
              className="text-sm font-medium"
            >
              Shop
            </Button>

            {/* Categories Dropdown */}
            <DropdownMenu open={categoriesOpen} onOpenChange={setCategoriesOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium gap-1"
                >
                  Categories
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => {
                      navigate({ page: 'shop', category: cat.slug })
                      setCategoriesOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <AnimatePresence>
              {searchOpen ? (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSearch}
                  className="flex items-center gap-1 overflow-hidden"
                >
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="h-9 w-9"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </AnimatePresence>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ page: 'cart' })}
              className="h-9 w-9 relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {mounted && totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ page: 'profile' })} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ page: 'orders' })} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate({ page: 'admin' })} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ page: 'login' })}
                className="hidden sm:flex text-sm font-medium"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center bg-foreground text-background shrink-0">
                      <span className="text-[9px] font-black">X</span>
                    </div>
                    XAANI
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  <Button
                    variant={route.page === 'home' ? 'secondary' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      navigate({ page: 'home' })
                      setMobileMenuOpen(false)
                    }}
                  >
                    Home
                  </Button>
                  <Button
                    variant={route.page === 'shop' ? 'secondary' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      navigate({ page: 'shop' })
                      setMobileMenuOpen(false)
                    }}
                  >
                    Shop
                  </Button>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Categories
                  </div>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant="ghost"
                      className="justify-start pl-8"
                      onClick={() => {
                        navigate({ page: 'shop', category: cat.slug })
                        setMobileMenuOpen(false)
                      }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                  <div className="my-2 border-t" />
                  {session?.user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate({ page: 'profile' })
                          setMobileMenuOpen(false)
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate({ page: 'orders' })
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Orders
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            navigate({ page: 'admin' })
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="justify-start text-destructive hover:text-destructive"
                        onClick={() => {
                          signOut({ callbackUrl: '/' })
                          setMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate({ page: 'login' })
                        setMobileMenuOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
