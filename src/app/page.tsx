'use client'

import React, { useState, useEffect, Component } from 'react'
import { SessionProvider, signOut, useSession } from 'next-auth/react'
import { ThemeProvider, useTheme } from 'next-themes'
import {
  ArrowRight, ShoppingCart, Menu, X, Sun, Moon, User, LogOut,
  Home as HomeIcon, Store, Package, Star, Search, Filter, ChevronLeft,
  Trash2, Plus, Minus, MapPin, Mail, Lock, Sparkles, CreditCard,
  CheckCircle2, AlertCircle, ChevronRight, LayoutGrid, ClipboardList,
  Library, Users, DollarSign, Heart, Truck, ShieldCheck, Send,
  Feather, Cpu, Briefcase, Landmark, HeartHandshake, Brain, Atom,
  Wallet, BookMarked, Facebook, Twitter, Instagram, Youtube,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, orderStatusStyles } from '@/lib/utils'

/* ─── Error Boundary ─── */
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground text-sm mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }} className="h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium">Reload Page</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ─── Simple Router ─── */
export type Route =
  | { page: 'home' }
  | { page: 'shop'; category?: string; search?: string }
  | { page: 'book'; slug: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'login' }
  | { page: 'register' }
  | { page: 'profile' }
  | { page: 'orders' }
  | { page: 'order-success'; orderId: string }
  | { page: 'admin' }
  | { page: 'admin-books' }
  | { page: 'admin-book-edit'; bookId?: string }
  | { page: 'admin-orders' }

import { createContext, useContext, useCallback } from 'react'

interface RouterContextType {
  route: Route
  navigate: (route: Route) => void
  goBack: () => void
}

const RouterContext = createContext<RouterContextType>({
  route: { page: 'home' },
  navigate: () => {},
  goBack: () => {},
})

function useRouter() {
  return useContext(RouterContext)
}

function routeToPath(route: Route) {
  if (route.page === 'home') return '/'
  if (route.page === 'shop') {
    const params = new URLSearchParams()
    if (route.category) params.set('category', route.category)
    if (route.search) params.set('search', route.search)
    const query = params.toString()
    return query ? `/shop?${query}` : '/shop'
  }
  if (route.page === 'book') return `/book/${encodeURIComponent(route.slug)}`
  if (route.page === 'cart') return '/cart'
  if (route.page === 'checkout') return '/checkout'
  if (route.page === 'login') return '/login'
  if (route.page === 'register') return '/register'
  if (route.page === 'profile') return '/profile'
  if (route.page === 'orders') return '/orders'
  if (route.page === 'order-success') return `/order/success/${encodeURIComponent(route.orderId)}`
  if (route.page === 'admin') return '/admin/dashboard'
  if (route.page === 'admin-books') return '/admin/books'
  if (route.page === 'admin-orders') return '/admin/orders'
  return '/'
}

function routeFromLocation(fallback: Route): Route {
  if (typeof window === 'undefined') return fallback

  if (window.location.hash) {
    try {
      const oldRoute = JSON.parse(decodeURIComponent(window.location.hash.slice(1))) as Route
      window.history.replaceState(oldRoute, '', routeToPath(oldRoute))
      return oldRoute
    } catch {}
  }

  const { pathname, searchParams } = new URL(window.location.href)
  if (pathname === '/') return { page: 'home' }
  if (pathname === '/shop') {
    return {
      page: 'shop',
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
    }
  }
  if (pathname.startsWith('/book/')) return { page: 'book', slug: decodeURIComponent(pathname.replace('/book/', '')) }
  if (pathname === '/cart') return { page: 'cart' }
  if (pathname === '/checkout') return { page: 'checkout' }
  if (pathname === '/login') return { page: 'login' }
  if (pathname === '/register') return { page: 'register' }
  if (pathname === '/profile') return { page: 'profile' }
  if (pathname === '/orders') return { page: 'orders' }
  if (pathname.startsWith('/order/success/')) return { page: 'order-success', orderId: decodeURIComponent(pathname.replace('/order/success/', '')) }
  return fallback
}

function RouterProvider({ children, initialRoute = { page: 'home' } }: { children: React.ReactNode; initialRoute?: Route }) {
  const [route, setRoute] = useState<Route>(() => routeFromLocation(initialRoute))

  const navigate = useCallback((newRoute: Route) => {
    setRoute(newRoute)
    window.history.pushState(newRoute, '', routeToPath(newRoute))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate({ page: 'home' })
  }, [navigate])

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromLocation(initialRoute))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <RouterContext.Provider value={{ route, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  )
}

/* ─── Simple Cart ─── */
interface CartItem {
  id: string
  bookId: string
  quantity: number
  book: {
    id: string
    title: string
    author: string
    price: number
    discountPrice: number | null
    image: string
    stock: number
    slug: string
  }
}

type WishlistBook = {
  id: string
  title: string
  slug: string
  author: string
  price: number
  discountPrice: number | null
  image: string
  imageUrl?: string
  stock: number
  rating?: number
  category?: { id?: string; name: string; slug: string }
}

interface CartContextType {
  items: CartItem[]
  addItem: (bookId: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
})

function useCart() {
  return useContext(CartContext)
}

interface WishlistContextType {
  items: WishlistBook[]
  isWishlisted: (bookId: string) => boolean
  toggleWishlist: (book: WishlistBook) => boolean
  removeWishlist: (bookId: string) => void
  clearWishlist: () => void
  totalWishlist: number
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  isWishlisted: () => false,
  toggleWishlist: () => false,
  removeWishlist: () => {},
  clearWishlist: () => {},
  totalWishlist: 0,
})

function useWishlist() {
  return useContext(WishlistContext)
}

function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('xaani-cart')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem('xaani-cart', JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem = useCallback(async (bookId: string, quantity = 1) => {
    try {
      const res = await fetch(`/api/books/${bookId}`)
      if (!res.ok) return
      const book = await res.json()
      setItems(prev => {
        const existing = prev.find(i => i.bookId === bookId)
        if (existing) {
          return prev.map(i => i.bookId === bookId ? { ...i, quantity: i.quantity + quantity } : i)
        }
        return [...prev, {
          id: `item-${Date.now()}`,
          bookId: book.id,
          quantity,
          book: { id: book.id, title: book.title, author: book.author, price: book.price, discountPrice: book.discountPrice, image: book.image, stock: book.stock, slug: book.slug }
        }]
      })
    } catch {}
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + (i.book.discountPrice || i.book.price) * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

/* ─── Toast (simple inline) ─── */
function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistBook[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('xaani-wishlist')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed
            .reduce<WishlistBook[]>((acc, item: any) => {
              if (typeof item === 'string') {
                acc.push({
                  id: item,
                  title: 'Loading saved product...',
                  slug: item,
                  author: 'Loading brand',
                  price: 0,
                  discountPrice: null,
                  image: '/images/placeholders/product-placeholder.svg',
                  imageUrl: '/images/placeholders/product-placeholder.svg',
                  stock: 1,
                })
                return acc
              }

              if (!item?.id) return acc

              acc.push({
                id: item.id,
                title: item.title || 'Loading saved product...',
                slug: item.slug || item.id,
                author: item.author || 'Loading brand',
                price: Number(item.price ?? 0),
                discountPrice: item.discountPrice === undefined ? null : item.discountPrice,
                image: item.image || item.imageUrl || '/images/placeholders/product-placeholder.svg',
                imageUrl: item.imageUrl || item.image || '/images/placeholders/product-placeholder.svg',
                stock: Number(item.stock ?? 1),
                rating: item.rating,
                category: item.category,
              })
              return acc
            }, [])
        }
      }
    } catch {}
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem('xaani-wishlist', JSON.stringify(items))
    } catch {}
  }, [items])

  useEffect(() => {
    const incompleteItems = items.filter((item) => item.id && (!item.title || item.title === 'Loading saved product...' || !item.image || item.price == null))
    if (incompleteItems.length === 0) return

    let cancelled = false

    Promise.all(
      incompleteItems.map((item) =>
        fetch(`/api/books/${item.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((books) => {
      if (cancelled) return
      const booksBySavedKey = new Map<string, any>()
      books.forEach((book, index) => {
        if (book) booksBySavedKey.set(incompleteItems[index].id, book)
      })
      if (booksBySavedKey.size === 0) return

      setItems((prev) =>
        prev.map((item) => {
          const book = booksBySavedKey.get(item.id)
          if (!book) return item
          return {
            id: book.id,
            title: book.title,
            slug: book.slug,
            author: book.author,
            price: book.price,
            discountPrice: book.discountPrice,
            image: book.image,
            imageUrl: book.imageUrl || book.image,
            stock: book.stock,
            rating: book.rating,
            category: book.category,
          }
        })
      )
    })

    return () => {
      cancelled = true
    }
  }, [items])

  const isWishlisted = useCallback((bookId: string) => items.some((item) => item.id === bookId), [items])

  const toggleWishlist = useCallback((book: WishlistBook) => {
    const exists = items.some((item) => item.id === book.id)
    setItems((prev) => {
      if (exists) return prev.filter((item) => item.id !== book.id)
      return [{
        id: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        price: book.price,
        discountPrice: book.discountPrice,
        image: book.image,
        imageUrl: (book as any).imageUrl || book.image,
        stock: book.stock,
        rating: book.rating,
        category: book.category,
      }, ...prev]
    })
    return !exists
  }, [items])

  const removeWishlist = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== bookId))
  }, [])

  const clearWishlist = useCallback(() => setItems([]), [])

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeWishlist, clearWishlist, totalWishlist: items.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {message}
    </div>
  )
}

/* ─── Navbar ─── */
function WishlistDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeWishlist, clearWishlist } = useWishlist()
  const { addItem } = useCart()
  const { navigate } = useRouter()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  const addWishlistItemToCart = async (book: WishlistBook) => {
    await addItem(book.id, 1)
    setToast({ message: `Added "${book.title}" to cart`, type: 'success' })
  }

  if (!open) return null

  const visibleItems = items.filter((book) => book?.id)
  const isHydrating = visibleItems.some((book) => book.title === 'Loading saved product...')

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <button aria-label="Close wishlist" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed bottom-0 right-0 top-0 z-[110] flex w-full flex-col border-l bg-background shadow-2xl sm:w-[380px] lg:w-[420px]">
        <div className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Heart className="h-5 w-5 fill-primary text-primary" />
              Wishlist
            </h2>
            <p className="text-sm text-muted-foreground">{visibleItems.length} saved {visibleItems.length === 1 ? 'product' : 'products'}</p>
          </div>
          <div className="flex items-center gap-1">
            {visibleItems.length > 0 && (
              <button onClick={clearWishlist} className="hidden h-9 rounded-md border px-3 text-xs font-medium hover:bg-accent sm:inline-flex sm:items-center">
                Clear
              </button>
            )}
            <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="Close wishlist">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No saved products yet</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">Tap the heart on any product to build a shortlist for later.</p>
            <button onClick={() => { onClose(); navigate({ page: 'shop' }) }} className="mt-5 h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
              <div className="mb-3 rounded-lg border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                {isHydrating ? 'Refreshing saved product details...' : `Rendering ${visibleItems.length} saved ${visibleItems.length === 1 ? 'product' : 'products'}.`}
              </div>
              <div className="space-y-3">
                {visibleItems.map((book) => {
                  const title = book.title || 'Saved product'
                  const author = book.author || 'Unknown brand'
                  const image = book.image || book.imageUrl || '/images/placeholders/product-placeholder.svg'
                  const slug = book.slug || book.id
                  const price = Number(book.discountPrice || book.price || 0)

                  return (
                  <div key={book.id} className="group rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-3">
                    <div className="flex gap-3">
                      <button onClick={() => { onClose(); navigate({ page: 'book', slug }) }} className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border sm:h-28 sm:w-20">
                        <CoverImage src={image} alt={title} className="h-full w-full object-cover" />
                      </button>
                      <div className="min-w-0 flex-1">
                        {book.category && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{book.category.name}</span>}
                        <button onClick={() => { onClose(); navigate({ page: 'book', slug }) }} className="mt-1 block text-left text-sm font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">
                          {title}
                        </button>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{author}</p>
                        <p className="mt-2 text-sm font-bold">{price > 0 ? formatCurrency(price) : 'Price unavailable'}</p>
                        <div className="mt-2 flex items-center gap-2 sm:mt-3">
                          <button
                            onClick={() => addWishlistItemToCart(book)}
                            disabled={book.stock === 0}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Add
                          </button>
                          <button onClick={() => removeWishlist(book.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:text-destructive transition-colors" aria-label={`Remove ${book.title}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
            <div className="flex-shrink-0 border-t bg-background/95 p-3 sm:hidden">
              <button onClick={clearWishlist} className="h-9 w-full rounded-md border text-sm font-medium hover:bg-accent transition-colors">
                Clear Wishlist
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function CoverImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  onClick,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
  priority?: boolean
  onClick?: () => void
}) {
  const fallbackSrc = '/images/placeholders/product-placeholder.svg'
  const safeSrc = src || fallbackSrc
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted via-background to-muted text-muted-foreground">
          <Package className="h-7 w-7 opacity-40" />
          <span className="mt-2 max-w-[80%] text-center text-xs font-medium line-clamp-2">{alt}</span>
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
        </div>
      )}
      <img
        src={failed ? fallbackSrc : safeSrc}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? 'eager' : loading}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onClick={onClick}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) {
            setFailed(true)
            setLoaded(false)
          }
        }}
      />
    </>
  )
}

function Navbar() {
  const { route, navigate } = useRouter()
  const { totalItems } = useCart()
  const { totalWishlist } = useWishlist()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ page: 'shop', search: searchQuery.trim() || undefined })
    setSearchOpen(false)
    setMobileOpen(false)
  }

  return (
    <>
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm' : 'bg-background/50 backdrop-blur-sm border-b border-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-2 sm:gap-4">
          <button onClick={() => navigate({ page: 'home' })} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <div className="flex h-9 w-9 items-center justify-center bg-foreground text-background shrink-0">
              <span className="text-sm font-black tracking-widest">X</span>
            </div>
            <span className="text-xl font-black tracking-[0.12em] uppercase">XAANI</span>
          </button>
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            <button onClick={() => navigate({ page: 'home' })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${route.page === 'home' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
              <HomeIcon className="h-4 w-4" />
              Home
            </button>
            <button onClick={() => navigate({ page: 'shop' })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${route.page === 'shop' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
              <Store className="h-4 w-4" />
              Shop
            </button>
            {[
              { label: 'Men', slug: 'men', icon: User },
              { label: 'Streetwear', slug: 'streetwear', icon: Store },
              { label: 'Hoodies', slug: 'hoodies', icon: Heart },
              { label: 'Jackets', slug: 'jackets', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon
              const active = route.page === 'shop' && (route as any).category === item.slug
              return (
                <button
                  key={item.slug}
                  onClick={() => navigate({ page: 'shop', category: item.slug })}
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Inline expanding search (desktop) */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 items-center justify-end">
            <div className={`flex items-center transition-all duration-300 ease-out ${searchOpen ? 'w-full max-w-xs' : 'w-9'}`}>
              {searchOpen ? (
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                    placeholder="Search products, brands..."
                    className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button type="button" onClick={() => { setSearchQuery(''); setSearchOpen(false) }} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors" aria-label="Close search">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setSearchOpen(true)} className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="Search">
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors md:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
            <button onClick={() => setWishlistOpen(true)} className="relative h-9 w-9 hidden sm:inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Wishlist" title="Wishlist">
              <Heart className="h-4 w-4" />
              {mounted && totalWishlist > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold flex items-center justify-center rounded-full bg-primary text-primary-foreground">{totalWishlist}</span>}
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => navigate({ page: 'cart' })} className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent relative transition-colors" aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
              {mounted && totalItems > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold flex items-center justify-center rounded-full bg-primary text-primary-foreground">{totalItems}</span>}
            </button>
            {session?.user ? (
              <>
                <button onClick={() => navigate({ page: 'profile' })} className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="Profile"><User className="h-4 w-4" /></button>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => navigate({ page: 'login' })} className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Sign In</button>
            )}
            <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent md:hidden transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t py-3 space-y-1">
            <form onSubmit={submitSearch} className="relative px-1 pb-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands..."
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </form>
            {[
              { label: 'Home', page: 'home' as const, icon: HomeIcon },
              { label: 'Shop', page: 'shop' as const, icon: Store },
              { label: 'Cart', page: 'cart' as const, icon: ShoppingCart },
              ...(session?.user
                ? [
                    { label: 'Profile', page: 'profile' as const, icon: User },
                    { label: 'Orders', page: 'orders' as const, icon: Package },
                  ]
                : [{ label: 'Sign In', page: 'login' as const, icon: User }]
              )
            ].map(i => (
              <button key={i.label} className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors" onClick={() => { navigate({ page: i.page }); setMobileOpen(false) }}>
                <i.icon className="h-4 w-4 text-muted-foreground" />
                {i.label}
              </button>
            ))}
            <div className="grid grid-cols-2 gap-2 px-1 py-2">
              {[
                { label: 'Men', slug: 'men', icon: User },
                { label: 'Streetwear', slug: 'streetwear', icon: Store },
                { label: 'Hoodies', slug: 'hoodies', icon: Heart },
                { label: 'Jackets', slug: 'jackets', icon: ShieldCheck },
              ].map(({ label, slug, icon: Icon }) => (
                <button
                  key={slug}
                  onClick={() => { navigate({ page: 'shop', category: slug }); setMobileOpen(false) }}
                  className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => { setWishlistOpen(true); setMobileOpen(false) }} className="w-full flex items-center justify-between gap-2.5 text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent transition-colors" title="Wishlist">
              <span className="flex items-center gap-2.5">
              <Heart className="h-4 w-4" />
              Wishlist
              </span>
              {mounted && totalWishlist > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{totalWishlist}</span>}
            </button>
            {session?.user && (
              <button className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors" onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }) }}>
                <LogOut className="h-4 w-4 text-muted-foreground" />
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
    <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  )
}

/* ─── Category icon mapping ─── */
function categoryIcon(slugOrName: string) {
  const key = (slugOrName || '').toLowerCase()
  if (key.includes('men')) return User
  if (key.includes('women')) return Sparkles
  if (key.includes('footwear')) return Package
  if (key.includes('access')) return Wallet
  if (key.includes('street')) return Store
  if (key.includes('hood')) return Heart
  if (key.includes('jacket')) return ShieldCheck
  if (key.includes('formal')) return Briefcase
  if (key.includes('active')) return Cpu
  if (key.includes('summer')) return Sun
  return LayoutGrid
}

const REVIEWS_IMAGE = '/images/products/senshi-tee.jpg.jpeg'

const FEATURED_COLLECTIONS = [
  {
    title: 'FAITH Collection',
    desc: 'Not the absence of doubt — the decision to move forward despite it.',
    category: 'streetwear',
    image: '/images/products/faith-tee-maroon.jpg.jpeg',
  },
  {
    title: 'SENSHI Series',
    desc: 'A warrior walks with discipline, honor, and silence.',
    category: 'streetwear',
    image: '/images/products/senshi-tee.jpg.jpeg',
  },
  {
    title: 'Outerwear Edit',
    desc: 'Royalty-free jacket placeholders until XAANI studio product photography is ready.',
    category: 'jackets',
    image: '/images/placeholders/jackets/bomber-black.webp',
  },
]

const REVIEW_QUOTES = [
  ['Aryan M.', 'The FAITH tee hits different. Heavy fabric, clean print, and the oversized fit is exactly right.'],
  ['Riya S.', 'SENSHI Tee got so many compliments. The graphic quality is insane for the price.'],
  ['Kabir V.', 'XAANI knows how to make a tee that actually feels premium. Ordered two more.'],
]

const BRAND_IMAGES = [
  { src: '/images/products/faith-tee-white.jpg.jpeg', alt: 'FAITH Tee White' },
  { src: '/images/products/faith-tee-maroon.jpg.jpeg', alt: 'FAITH Tee Maroon' },
  { src: '/images/products/senshi-tee.jpg.jpeg', alt: 'SENSHI Samurai Tee' },
  { src: '/images/products/silent-dominance-tee.jpg.jpeg', alt: 'Silent Dominance Tee' },
]

const BRAND_VALUES = [
  { icon: Sparkles, title: 'Premium Fabric', desc: 'Heavyweight 100% cotton. Built to outlast everything.' },
  { icon: Package, title: 'Oversized Fit', desc: 'Engineered silhouettes for the perfect oversized look.' },
  { icon: Truck, title: 'Fast Shipping', desc: 'Orders dispatched within 24 hours of confirmation.' },
  { icon: Wallet, title: 'Cash On Delivery', desc: 'Pay on delivery — no cards, no stress.' },
]

function ProductEditorialCard({
  book,
  navigate,
  isWishlisted,
  onWishlist,
  compact = false,
}: {
  book: any
  navigate: (route: Route) => void
  isWishlisted: (bookId: string) => boolean
  onWishlist: (e: React.MouseEvent, book: any) => void
  compact?: boolean
}) {
  const hasDiscount = book.discountPrice && book.discountPrice < book.price

  return (
    <article
      className="group min-w-0 cursor-pointer"
      onClick={() => navigate({ page: 'book', slug: book.slug })}
    >
      <div className={`relative overflow-hidden bg-muted ${compact ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}>
        <CoverImage
          src={book.image || book.imageUrl || null}
          alt={book.title || 'Product'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
            Sale
          </span>
        )}
        <button
          onClick={(e) => onWishlist(e, book)}
          aria-label={isWishlisted(book.id) ? `Remove ${book.title} from wishlist` : `Save ${book.title} to wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90 text-black shadow-sm transition hover:bg-white"
        >
          <Heart className={`h-4 w-4 ${isWishlisted(book.id) ? 'fill-black' : ''}`} />
        </button>
      </div>
      <div className="pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{book.author}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-medium tracking-tight">{book.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span>{formatCurrency(book.discountPrice || book.price)}</span>
          {hasDiscount && <span className="text-muted-foreground line-through">{formatCurrency(book.price)}</span>}
        </div>
      </div>
    </article>
  )
}

/* ─── Home View ─── */
function HomeView() {
  const { navigate } = useRouter()
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { data: session } = useSession()
  const [books, setBooks] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [brandImageIndex, setBrandImageIndex] = useState(0)
  const [heroImageIndex, setHeroImageIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setBrandImageIndex(i => (i + 1) % BRAND_IMAGES.length), 3500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setHeroImageIndex(i => (i + 1) % BRAND_IMAGES.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/books?featured=true&limit=8').then(r => r.json()).catch(() => ({ books: [] })),
      fetch('/api/books?sort=rating&order=desc&limit=5').then(r => r.json()).catch(() => ({ books: [] })),
      fetch('/api/books?sort=stock&order=desc&limit=6').then(r => r.json()).catch(() => ({ books: [] })),
      fetch('/api/categories').then(r => r.json()).catch(() => []),
    ]).then(([bd, td, sd, cd]) => {
      setBooks(bd.books || [])
      setTrending(td.books || [])
      setBestSellers(sd.books || [])
      setCategories(Array.isArray(cd) ? cd : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleQuickAdd = async (e: React.MouseEvent, book: any) => {
    e.stopPropagation()
    if (!session?.user) {
      setToast({ message: 'Please sign in to add items to cart', type: 'error' })
      navigate({ page: 'login' })
      return
    }
    await addItem(book.id, 1)
    setToast({ message: `Added "${book.title}" to cart`, type: 'success' })
  }

  const handleWishlist = (e: React.MouseEvent, book: any) => {
    e.stopPropagation()
    const added = toggleWishlist(book)
    setToast({ message: added ? `Saved "${book.title}" to wishlist` : `Removed "${book.title}" from wishlist`, type: 'success' })
  }

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setSubscribed(true)
  }

  const bestSellerProducts = bestSellers.slice(0, 8)
  const trendingProducts = trending.slice(0, 8)
  const categoryCards = ['men', 'streetwear', 'hoodies', 'jackets']
    .map((slug) => categories.find((cat: any) => cat.slug === slug))
    .filter(Boolean)

  return (
    <div className="bg-background text-foreground">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-black px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white">
        Free Delivery Above ₹999 <span className="mx-3 text-white/40">/</span> XAANI 2025 Drops Now Live <span className="mx-3 text-white/40">/</span> New Arrivals Every Week
      </div>

      <section className="relative min-h-[90vh] overflow-hidden">
        {BRAND_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === heroImageIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <CoverImage src={img.src} alt={img.alt} priority={i === 0} className="h-full w-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative flex min-h-[90vh] items-end px-4 pb-16 sm:px-8 lg:px-14 lg:pb-24">
          <div className="max-w-3xl text-white">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-white/70">XAANI 2025</p>
            <h1 className="text-6xl font-black leading-[0.9] tracking-tight sm:text-8xl lg:text-[108px] uppercase">
              Built<br />Different.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
              Premium streetwear designed for everyday confidence.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => navigate({ page: 'shop' })} className="h-12 bg-white px-8 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-white/90">
                Shop Collection
              </button>
              <button onClick={() => navigate({ page: 'shop', category: 'streetwear' })} className="h-12 border border-white px-8 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black">
                New Arrivals
              </button>
            </div>
            <div className="mt-8 flex gap-2">
              {BRAND_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroImageIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === heroImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                  aria-label={`View image ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-14 sm:px-8 lg:px-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Shop by category</p>
            <h2 className="mt-2 text-3xl font-medium tracking-tight">Wardrobe departments</h2>
          </div>
          <button onClick={() => navigate({ page: 'shop' })} className="hidden text-xs font-semibold uppercase tracking-[0.18em] underline underline-offset-4 sm:inline">
            Shop all
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categoryCards.map((cat: any) => (
              <button key={cat.id} onClick={() => navigate({ page: 'shop', category: cat.slug })} className="group text-left">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <CoverImage
                    src={cat.image || '/images/placeholders/product-placeholder.svg'}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <p className="absolute inset-x-0 bottom-0 p-4 text-sm font-bold uppercase tracking-[0.18em] text-white">{cat.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-16 sm:px-8 lg:px-14">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">XAANI Drops</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight uppercase">The Collection</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {FEATURED_COLLECTIONS.map((collection, index) => (
            <button
              key={collection.title}
              onClick={() => navigate({ page: 'shop', category: collection.category })}
              className="group relative min-h-[500px] overflow-hidden text-left text-white"
            >
              <CoverImage src={collection.image} alt={collection.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-3xl font-black tracking-tight uppercase">{collection.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">{collection.desc}</p>
                <span className="mt-5 inline-flex text-xs font-bold uppercase tracking-[0.2em] underline underline-offset-4">Shop now</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-black text-white py-20">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/50 mb-5">Our Story</p>
              <h2 className="text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">XAANI</h2>
              <div className="mt-8 space-y-4 max-w-lg">
                <p className="text-base leading-7 text-white/70">Streetwear inspired by discipline, individuality, and self-expression. We build pieces that speak without words.</p>
                <p className="text-base leading-7 text-white/70">Every graphic carries a meaning. Every tee is heavyweight cotton, built for the ones who move forward in silence.</p>
              </div>
              <button onClick={() => navigate({ page: 'shop' })} className="mt-10 h-12 border border-white px-8 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black">
                Explore the Brand
              </button>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden">
              {BRAND_IMAGES.map((img, i) => (
                <div
                  key={img.src}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === brandImageIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                  <CoverImage src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                </div>
              ))}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {BRAND_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBrandImageIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === brandImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-14">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Best sellers</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight uppercase">Most Wanted</h2>
            </div>
            <button onClick={() => navigate({ page: 'shop' })} className="hidden text-xs font-semibold uppercase tracking-[0.18em] underline underline-offset-4 sm:inline">
              View all
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />)}
            </div>
          ) : bestSellerProducts.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-xl">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">New drops coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {bestSellerProducts.map((book: any) => (
                <ProductEditorialCard key={book.id} book={book} navigate={navigate} isWishlisted={isWishlisted} onWishlist={handleWishlist} compact />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-16 sm:px-8 lg:px-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trending products</p>
            <h2 className="mt-2 text-3xl font-medium tracking-tight">Currently styling</h2>
          </div>
          <button onClick={() => navigate({ page: 'shop' })} className="hidden text-xs font-semibold uppercase tracking-[0.18em] underline underline-offset-4 sm:inline">
            Shop trending
          </button>
        </div>
        {loading ? (
          <div className="flex snap-x gap-4 overflow-x-auto pb-3 no-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[68vw] shrink-0 snap-start sm:w-[34vw] lg:w-[22vw] xl:w-[18vw]">
                <div className="aspect-[3/4] bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="py-16 text-center border border-dashed rounded-xl">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-muted-foreground">New drops trending soon.</p>
          </div>
        ) : (
          <div className="flex snap-x gap-4 overflow-x-auto pb-3 no-scrollbar">
            {trendingProducts.map((book: any) => (
              <div key={book.id} className="w-[68vw] shrink-0 snap-start sm:w-[34vw] lg:w-[22vw] xl:w-[18vw]">
                <ProductEditorialCard book={book} navigate={navigate} isWishlisted={isWishlisted} onWishlist={handleWishlist} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="mx-auto grid max-w-[1300px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Customer reviews</p>
            <h2 className="mt-2 text-4xl font-black leading-tight tracking-tight uppercase">People Are Talking.</h2>
            <div className="mt-8 relative aspect-[4/5] overflow-hidden bg-muted">
              <CoverImage src={REVIEWS_IMAGE} alt="XAANI customer wearing FAITH Tee" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="grid content-center gap-6">
            {REVIEW_QUOTES.map(([name, quote]) => (
              <figure key={name} className="border-b border-border/70 pb-6">
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />)}
                </div>
                <blockquote className="text-2xl font-medium leading-snug tracking-tight">"{quote}"</blockquote>
                <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 py-12">
        <div className="mx-auto grid max-w-[1300px] grid-cols-2 gap-6 px-4 text-center sm:px-8 lg:grid-cols-4 lg:px-14">
          {BRAND_VALUES.map((item) => (
            <div key={item.title} className="px-2">
              <item.icon className="mx-auto h-7 w-7 stroke-[1.5]" />
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.14em]">{item.title}</h3>
              <p className="mx-auto mt-2 max-w-48 text-xs leading-5 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1200px] border border-border bg-[#f5f1ea] px-6 py-12 text-center text-black sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-black/55">XAANI Inner Circle</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-black leading-tight tracking-tight uppercase sm:text-5xl">Drop Notifications.<br />Early Access.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/60">Join the XAANI list — get notified on new drops, limited editions, and exclusive offers before anyone else.</p>
          {subscribed ? (
            <div className="mt-7 inline-flex items-center gap-2 border border-black/20 bg-white px-4 py-3 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Thanks for subscribing.
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                type="email"
                required
                placeholder="Email address"
                className="h-12 flex-1 border border-black/20 bg-white px-4 text-sm outline-none focus:border-black"
              />
              <button type="submit" className="h-12 bg-black px-7 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/85">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

/* ─── Shop View ─── */
function ShopView() {
  const { route, navigate } = useRouter()
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { data: session } = useSession()
  const [books, setBooks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState((route as any).search || '')
  const [selectedCat, setSelectedCat] = useState((route as any).category || '')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)
  const [fetchedKey, setFetchedKey] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const key = `${search}-${selectedCat}-${sortBy}-${sortOrder}-${minPrice}-${maxPrice}-${page}`
  const loading = fetchedKey !== key

  useEffect(() => { fetch('/api/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {}) }, [])

  useEffect(() => {
    setSearch((route as any).search || '')
    setSelectedCat((route as any).category || '')
    setPage(1)
  }, [route])

  useEffect(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (selectedCat) p.set('category', selectedCat)
    if (minPrice) p.set('minPrice', minPrice)
    if (maxPrice) p.set('maxPrice', maxPrice)
    p.set('sort', sortBy)
    p.set('order', sortOrder)
    p.set('page', page.toString())
    p.set('limit', '12')
    fetch(`/api/books?${p}`)
      .then(r => r.json())
      .then(d => { setBooks(d.books || []); setTotalPages(d.pagination?.totalPages || 1); setTotalBooks(d.pagination?.total || 0); setFetchedKey(key) })
      .catch(() => { setBooks([]); setFetchedKey(key) })
  }, [search, selectedCat, sortBy, sortOrder, minPrice, maxPrice, page, key])

  const handleQuickAdd = async (e: React.MouseEvent, book: any) => {
    e.stopPropagation()
    if (!session?.user) {
      setToast({ message: 'Please sign in to add items to cart', type: 'error' })
      navigate({ page: 'login' })
      return
    }
    await addItem(book.id, 1)
    setToast({ message: `Added "${book.title}" to cart`, type: 'success' })
  }

  const handleWishlist = (e: React.MouseEvent, book: any) => {
    e.stopPropagation()
    const added = toggleWishlist(book)
    setToast({ message: added ? `Saved "${book.title}" to wishlist` : `Removed "${book.title}" from wishlist`, type: 'success' })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCat('')
    setMinPrice('')
    setMaxPrice('')
    setSelectedSize('')
    setSelectedColor('')
    setSelectedBrand('')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="text-muted-foreground mt-1.5">Search, filter, and sort the full XAANI collection.</p>
      </div>
      <div className="rounded-xl border bg-card p-4 mb-6 shadow-sm">
        <form onSubmit={e => { e.preventDefault(); setPage(1) }} className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, brand, or description..." className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setPage(1) }} className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm">
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1) }} type="number" min="0" step="1" placeholder="Min ₹" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <input value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1) }} type="number" min="0" step="1" placeholder="Max ₹" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Search className="h-4 w-4" /> Search
          </button>
        </form>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All sizes</option>
            {['XS', 'S', 'M', 'L', 'XL'].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All colors</option>
            {['Black', 'White', 'Navy', 'Olive', 'Tan', 'Red'].map(color => <option key={color} value={color}>{color}</option>)}
          </select>
          <input value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} placeholder="Brand" className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="createdAt">Newest</option>
              <option value="rating">Popular</option>
              <option value="price">Price Low-High / High-Low</option>
              <option value="title">Name</option>
            </select>
            <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1) }} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="asc">Price Low-High</option>
              <option value="desc">Price High-Low</option>
            </select>
            <button type="button" onClick={clearFilters} className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-accent transition-colors">Clear</button>
          </div>
          <p className="text-sm text-muted-foreground">{loading ? 'Loading products...' : `${totalBooks} products found`}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          <button onClick={clearFilters} className="mt-4 h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent transition-colors">Clear Filters</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {books.map((book: any) => {
              const hasDiscount = book.discountPrice && book.discountPrice < book.price
              return (
                <div key={book.id} className="group cursor-pointer" onClick={() => navigate({ page: 'book', slug: book.slug })}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-3">
                    <CoverImage src={book.image || null} alt={book.title || 'Product'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    {hasDiscount && (
                      <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
                        Sale
                      </span>
                    )}
                    {book.stock === 0 && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <span className="bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">Out of Stock</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleQuickAdd(e, book)}
                      disabled={book.stock === 0}
                      aria-label={`Add ${book.title} to cart`}
                      className="absolute bottom-3 left-3 right-14 h-10 bg-black text-xs font-semibold uppercase tracking-[0.16em] text-white opacity-0 translate-y-2 transition-all group-hover:translate-y-0 group-hover:opacity-100 disabled:hidden"
                    >
                      Add
                    </button>
                    <button
                      onClick={(e) => handleWishlist(e, book)}
                      aria-label={isWishlisted(book.id) ? `Remove ${book.title} from wishlist` : `Save ${book.title} to wishlist`}
                      title={isWishlisted(book.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90 text-black shadow-sm transition hover:bg-white"
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted(book.id) ? 'fill-black' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{book.author}</p>
                  <h3 className="mt-1 line-clamp-1 text-sm font-medium tracking-tight">{book.title}</h3>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span>{formatCurrency(book.discountPrice || book.price)}</span>
                    {hasDiscount && <span className="text-muted-foreground line-through">{formatCurrency(book.price)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Book Detail View ─── */
function BookDetailView() {
  const { route, navigate, goBack } = useRouter()
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { data: session } = useSession()
  const slug = (route as any).slug as string
  const [book, setBook] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [fetchedSlug, setFetchedSlug] = useState<string | null>(null)
  const loading = fetchedSlug !== slug
  const [qty, setQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState('Black')
  const [activeImage, setActiveImage] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    fetch(`/api/books/${slug}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(data => {
        if (cancelled) return
        setBook(data)
        setFetchedSlug(slug)
        if (data.category?.slug) {
          fetch(`/api/books?category=${data.category.slug}&limit=4`)
            .then(r => r.json())
            .then(d => { if (!cancelled) setRelated((d.books || []).filter((b: any) => b.id !== data.id)) })
            .catch(() => {})
        }
      })
      .catch(() => { if (!cancelled) { setBook(null); setFetchedSlug(slug) } })
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  if (!book) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
      <h2 className="text-xl font-semibold">Product not found</h2>
      <button onClick={() => navigate({ page: 'shop' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Browse Shop</button>
    </div>
  )

  const effectivePrice = book.discountPrice || book.price
  const hasDiscount = book.discountPrice && book.discountPrice < book.price
  const reviewCount = Math.max(24, Math.round((book.rating || 4.5) * 87))
  const specs = [
    { label: 'Fit', value: 'Regular modern fit' },
    { label: 'Care', value: 'Machine wash cold' },
    { label: 'Category', value: book.category?.name || 'Products' },
    { label: 'Availability', value: book.stock > 0 ? 'In stock' : 'Out of stock' },
  ]
  const gallery = book.image ? [book.image] : []

  const handleAddToCart = async () => {
    if (!session?.user) {
      setToast({ message: 'Please sign in to add items to cart', type: 'error' })
      navigate({ page: 'login' })
      return
    }
    await addItem(book.id, qty)
    setToast({ message: `Added "${book.title}" to cart`, type: 'success' })
  }

  const handleWishlist = () => {
    const added = toggleWishlist(book)
    setToast({ message: added ? `Saved "${book.title}" to wishlist` : `Removed "${book.title}" from wishlist`, type: 'success' })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-16">
        <div>
          <div className="sticky top-24">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-xl ring-1 ring-border">
              <CoverImage src={gallery[activeImage]} alt={book.title} priority className="h-full w-full object-cover" />
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-destructive text-white text-sm font-bold px-2 py-1 rounded">-{Math.round(((book.price - book.discountPrice) / book.price) * 100)}% OFF</span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {gallery.map((image, index) => (
                  <button key={index} onClick={() => setActiveImage(index)} className={`relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 transition ${activeImage === index ? 'ring-primary' : 'ring-border hover:ring-primary/40'}`}>
                    <CoverImage src={image} alt={`${book.title} view ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              {[{ icon: Truck, label: 'Fast delivery' }, { icon: ShieldCheck, label: 'Secure checkout' }, { icon: CheckCircle2, label: 'Premium fabric' }].map((item) => (
                <div key={item.label} className="rounded-lg border bg-card p-3">
                  <item.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {book.category && (
            <Badge variant="secondary" className="w-fit mb-3 font-medium">{book.category.name}</Badge>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{book.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">{book.author}</p>
          {typeof book.rating === 'number' && (
            <div className="flex items-center gap-1 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(book.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
              ))}
              <span className="text-sm text-muted-foreground ml-1.5">{book.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
            </div>
          )}
          <div className="flex items-baseline gap-3 mt-6">
            <span className="text-3xl font-bold">{formatCurrency(effectivePrice)}</span>
            {hasDiscount && <span className="text-lg text-muted-foreground line-through">{formatCurrency(book.price)}</span>}
          </div>
          <div className="mt-4">
            {book.stock > 10 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> In Stock
              </span>
            ) : book.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle className="h-4 w-4" /> Only {book.stock} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 font-medium">
                <AlertCircle className="h-4 w-4" /> Out of Stock
              </span>
            )}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
          </div>
          <div className="mt-6 grid gap-5 border-t pt-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Size</h3>
              <div className="grid grid-cols-5 gap-2">
                {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                  <button key={size} onClick={() => setSelectedSize(size)} className={`h-10 rounded-md border text-sm font-semibold transition-colors ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Color</h3>
              <div className="flex flex-wrap gap-2">
                {['Black', 'White', 'Navy', 'Olive', 'Tan'].map(color => (
                  <button key={color} onClick={() => setSelectedColor(color)} className={`h-10 rounded-md border px-3 text-sm font-medium transition-colors ${selectedColor === color ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40" disabled={qty <= 1}>
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(book.stock, qty + 1))} className="h-10 w-10 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40" disabled={qty >= book.stock}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={book.stock === 0} className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
              <ShoppingCart className="h-4 w-4" />
              {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button onClick={handleWishlist} className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-accent flex items-center justify-center gap-2 transition-colors">
              <Heart className={`h-4 w-4 ${isWishlisted(book.id) ? 'fill-primary text-primary' : ''}`} />
              {isWishlisted(book.id) ? 'Saved' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold tracking-tight">Product Details</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {book.title} is part of XAANI&apos;s premium streetwear collection, crafted from heavyweight cotton with bold graphic prints and an oversized silhouette built for everyday confidence. Selected size: {selectedSize}. Selected color: {selectedColor}.
          </p>
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-bold tracking-tight">Specifications</h2>
          <dl className="mt-4 space-y-3">
            {specs.map((spec) => (
              <div key={spec.label} className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{spec.label}</dt>
                <dd className="font-medium text-right">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-xl border bg-card p-6 lg:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Customer Reviews</h2>
              <p className="text-sm text-muted-foreground mt-1">A polished preview of customer sentiment for this product.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{book.rating?.toFixed?.(1) || book.rating}</span>
              <span className="text-sm text-muted-foreground">{reviewCount} ratings</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Beautiful fit', 'The fabric feels premium and the shape works with everything.'],
              ['Worth the hype', 'Arrived quickly and matched the photos. Easy to style.'],
              ['Great wardrobe pick', 'Bought this for a trip and the finish felt premium for the price.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border bg-background p-4">
                <div className="mb-2 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      {related.length > 0 && (
        <div className="mt-16 pt-12 border-t">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((b: any) => (
              <div key={b.id} className="group cursor-pointer rounded-lg border border-transparent hover:border-border hover:shadow-md transition-all p-2 -m-2" onClick={() => navigate({ page: 'book', slug: b.slug })}>
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted mb-3">
                  <CoverImage src={b.image || null} alt={b.title || 'Product'} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="text-sm font-semibold line-clamp-2">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.author}</p>
                <span className="text-sm font-bold">{formatCurrency(b.discountPrice || b.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Cart View ─── */
function CartView() {
  const { navigate, goBack } = useRouter()
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-lg font-semibold">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Looks like you haven&apos;t added any products yet.</p>
          <button onClick={() => navigate({ page: 'shop' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Browse Shop</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const p = item.book.discountPrice || item.book.price
              return (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl border bg-card transition-shadow hover:shadow-sm">
                  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-border cursor-pointer" onClick={() => navigate({ page: 'book', slug: item.book.slug })}>
                    <CoverImage src={item.book.image || null} alt={item.book.title || 'Product'} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.book.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.book.author}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2 py-0.5">Size M</span>
                      <span className="rounded-full border px-2 py-0.5">Color Black</span>
                      <span className="rounded-full border px-2 py-0.5">Qty {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="h-7 w-7 flex items-center justify-center rounded border hover:bg-accent transition-colors disabled:opacity-40" disabled={item.quantity <= 1}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center rounded border hover:bg-accent transition-colors disabled:opacity-40" disabled={item.quantity >= item.book.stock}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                      <span className="font-semibold">{formatCurrency(p * item.quantity)}</span>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="rounded-xl border bg-card p-6 h-fit sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items ({totalItems})</span><span>{formatCurrency(totalPrice)}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
              </div>
              <div className="border-t pt-3"><div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{formatCurrency(totalPrice)}</span></div></div>
              <button onClick={() => navigate({ page: 'checkout' })} className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">Proceed to Checkout</button>
              <button onClick={() => navigate({ page: 'shop' })} className="w-full h-10 rounded-md border text-sm font-medium hover:bg-accent transition-colors">Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Auth View ─── */
function AuthView() {
  const { route, navigate } = useRouter()
  const isRegister = route.page === 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { data: session } = useSession()

  useEffect(() => { if (session?.user) navigate({ page: 'home' }) }, [session, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Registration failed'); return }
        // Auto sign in after register
      }
      const { signIn } = await import('next-auth/react')
      const result = await signIn('credentials', { email, password, customerLogin: 'true', redirect: false })
      if (result?.error) setError('Invalid email or password')
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-foreground flex items-center justify-center mx-auto mb-3">
            <span className="text-lg font-black text-background tracking-wider">X</span>
          </div>
          <h2 className="text-2xl font-black tracking-[0.06em] uppercase">Welcome to XAANI</h2>
          <p className="text-muted-foreground text-sm mt-1">{isRegister ? 'Create an account' : 'Sign in to your account'}</p>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={name} onChange={e => setName(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Your name" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="At least 6 characters" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => navigate({ page: isRegister ? 'login' : 'register' })} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
        <div className="mt-6 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Demo Accounts:</p>
          <p>Customer: customer@example.com / customer123</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Profile View ─── */
function ProfileView() {
  const { navigate, goBack } = useRouter()
  const { data: session } = useSession()

  if (!session?.user) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-semibold">Please sign in</h2>
      <button onClick={() => navigate({ page: 'login' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Sign In</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Profile</h1>
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{(session.user.name || 'U')[0].toUpperCase()}</div>
          <div><h2 className="text-xl font-semibold">{session.user.name}</h2><p className="text-sm text-muted-foreground">{session.user.email}</p></div>
        </div>
        <div className="border-t pt-4 space-y-2">
          <button onClick={() => navigate({ page: 'orders' })} className="w-full h-10 rounded-md border text-sm font-medium hover:bg-accent text-left px-4 transition-colors flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" /> My Orders
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Orders View ─── */
function OrdersView() {
  const { navigate, goBack } = useRouter()
  const { data: session } = useSession()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/orders').then(r => r.json()).then(setOrders).catch(() => {}).finally(() => setLoading(false))
  }, [session])

  if (!session?.user) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-semibold">Please sign in</h2>
      <button onClick={() => navigate({ page: 'login' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Sign In</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Orders</h1>
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-lg font-semibold">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">Your past orders will show up here.</p>
          <button onClick={() => navigate({ page: 'shop' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Browse Shop</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="p-5 rounded-xl border bg-card transition-shadow hover:shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-muted-foreground">Order #{o.id.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Payment: {o.paymentMethod || 'COD'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`border-transparent capitalize ${orderStatusStyles(o.status)}`}>{o.status}</Badge>
                  <span className="font-semibold">{formatCurrency(o.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Checkout View ─── */
function CheckoutView() {
  const { navigate, goBack } = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) { navigate({ page: 'login' }); return }
    if (items.length === 0) { setError('Cart is empty'); return }
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: fd.get('address'), city: fd.get('city'),
          state: fd.get('state'), zip: fd.get('zip'), country: fd.get('country'),
          paymentMethod,
          items: items.map((item) => ({ bookId: item.bookId, quantity: item.quantity }))
        })
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return }
      const order = await res.json()
      await clearCart()
      window.location.href = `/order/success/${order.id}`
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  if (!session?.user) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h2 className="text-xl font-semibold">Please sign in</h2>
      <button onClick={() => navigate({ page: 'login' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Sign In</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Shipping Address</h2>
            <div><label className="text-sm font-medium">Address</label><input name="address" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">City</label><input name="city" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
              <div><label className="text-sm font-medium">State</label><input name="state" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">ZIP</label><input name="zip" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
              <div><label className="text-sm font-medium">Country</label><input name="country" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /> Payment Method</h2>
            <label className="flex items-center gap-2 text-sm rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
              Cash On Delivery (COD)
            </label>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-base font-semibold mb-2 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-muted-foreground" /> Review Order</h2>
            <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'} · Payment: {paymentMethod}</p>
          </div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2">
            <CreditCard className="h-4 w-4" /> {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
        <div className="rounded-xl border bg-card p-6 h-fit sticky top-24">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3">
            {items.map(item => <div key={item.id} className="flex justify-between text-sm"><span className="line-clamp-1">{item.book.title} x{item.quantity}</span><span>{formatCurrency((item.book.discountPrice || item.book.price) * item.quantity)}</span></div>)}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span>{paymentMethod}</span></div>
            <div className="border-t pt-3"><div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(totalPrice)}</span></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Admin View ─── */
function AdminView() {
  const { navigate, goBack } = useRouter()
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json() })
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!session?.user || String((session.user as any).role).toUpperCase() !== 'ADMIN') return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground mt-2">You need admin privileges.</p>
      <button onClick={() => navigate({ page: 'home' })} className="mt-4 h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Go Home</button>
    </div>
  )

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const statCards = stats ? [
    { title: 'Total Products', value: stats.totalBooks, icon: Store, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { title: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { title: 'Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: DollarSign, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  ] : []

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.title} className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
            <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-sm text-muted-foreground">{s.title}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      {stats?.recentOrders?.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-muted-foreground" /> Recent Orders</h2>
          <div className="space-y-3">
            {stats.recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div><p className="text-sm font-mono">#{o.id.slice(-8)}</p><p className="text-xs text-muted-foreground">{o.user?.name || o.user?.email}</p></div>
                <div className="flex items-center gap-3">
                  <Badge className={`border-transparent capitalize ${orderStatusStyles(o.status)}`}>{o.status}</Badge>
                  <span className="font-medium text-sm">{formatCurrency(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Footer ─── */
function Footer() {
  const { navigate } = useRouter()
  return (
    <footer className="mt-auto border-t bg-[#f4f4f2] text-black">
      <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr_1.2fr]">
          <div>
            <button onClick={() => navigate({ page: 'home' })} className="mb-5 flex items-center gap-2 text-left transition-opacity hover:opacity-70">
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white shrink-0">
                <span className="text-xs font-black">X</span>
              </div>
              <span className="text-2xl font-black uppercase tracking-[0.2em]">XAANI</span>
            </button>
            <p className="max-w-sm text-sm leading-6 text-black/60">Premium streetwear inspired by discipline, individuality, and self-expression.</p>
            <div className="mt-6 flex items-center gap-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  title={`${label} (coming soon)`}
                  className="text-black/55 transition-colors hover:text-black cursor-default"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]">Account</h3>
            <ul className="space-y-2.5">
              {[{ l: 'Log In', p: 'login' as const }, { l: 'Profile', p: 'profile' as const }, { l: 'Orders', p: 'orders' as const }, { l: 'Cart', p: 'cart' as const }].map(i => (
                <li key={i.l}><button onClick={() => navigate({ page: i.p })} className="text-sm text-black/55 transition-colors hover:text-black">{i.l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]">Company</h3>
            <ul className="space-y-2.5">
              {[{ l: 'Home', p: 'home' as const }, { l: 'Shop', p: 'shop' as const }, { l: 'Cart', p: 'cart' as const }].map(i => (
                <li key={i.l}><button onClick={() => navigate({ page: i.p })} className="text-sm text-black/55 transition-colors hover:text-black">{i.l}</button></li>
              ))}
              <li><span className="text-sm text-black/55">Sustainability</span></li>
              <li><span className="text-sm text-black/55">Stores</span></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]">Shop</h3>
            <ul className="space-y-2.5">
              {[
                ['Men', 'men'],
                ['Streetwear', 'streetwear'],
                ['Hoodies', 'hoodies'],
                ['Jackets', 'jackets'],
              ].map(([label, slug]) => (
                <li key={slug}><button onClick={() => navigate({ page: 'shop', category: slug })} className="text-sm text-black/55 transition-colors hover:text-black">{label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]">Get updates</h3>
            <p className="text-sm leading-6 text-black/60">New arrivals, limited edits, and private offers.</p>
            <div className="mt-5 flex border border-black/20 bg-white">
              <input aria-label="Newsletter email" placeholder="Email address" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
              <button title="Subscribe" className="flex h-12 w-12 shrink-0 items-center justify-center bg-black text-white transition-colors hover:bg-black/85">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-2.5 text-sm text-black/55">
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> hello@xaani.com</p>
              <p className="flex items-center gap-2"><Send className="h-3.5 w-3.5 shrink-0" /> +91 98765 43210</p>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/10 pt-6 text-center text-xs text-black/45 sm:flex-row sm:text-left">
          <span>&copy; {new Date().getFullYear()} XAANI. All rights reserved.</span>
          <span>Privacy Policy&nbsp;&nbsp;/&nbsp;&nbsp;Terms of Service&nbsp;&nbsp;/&nbsp;&nbsp;Accessibility</span>
        </div>
      </div>
    </footer>
  )
}

/* ─── Main App Content ─── */
function AppContent() {
  const { route } = useRouter()

  const renderView = () => {
    switch (route.page) {
      case 'home': return <HomeView />
      case 'shop': return <ShopView />
      case 'book': return <BookDetailView />
      case 'cart': return <CartView />
      case 'checkout': return <CheckoutView />
      case 'login': case 'register': return <AuthView />
      case 'profile': return <ProfileView />
      case 'orders': return <OrdersView />
      case 'admin': return <AdminView />
      default: return <HomeView />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{renderView()}</main>
      <Footer />
    </div>
  )
}

/* ─── Root ─── */
export default function Home({ initialRoute }: { initialRoute?: Route }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RouterProvider initialRoute={initialRoute}>
            <CartProvider>
              <WishlistProvider>
                <AppContent />
              </WishlistProvider>
            </CartProvider>
          </RouterProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
