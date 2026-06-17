'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

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

interface RouterContextType {
  route: Route
  navigate: (route: Route) => void
  goBack: () => void
  history: Route[]
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter must be used within RouterProvider')
  return context
}

function getInitialRoute(): Route {
  if (typeof window === 'undefined') return { page: 'home' }
  const hash = window.location.hash.slice(1)
  if (hash) {
    try {
      return JSON.parse(decodeURIComponent(hash))
    } catch {
      // ignore parse errors
    }
  }
  return { page: 'home' }
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [initialRoute] = useState<Route>(getInitialRoute)
  const [history, setHistory] = useState<Route[]>([initialRoute])
  const [route, setRoute] = useState<Route>(initialRoute)

  const navigate = useCallback((newRoute: Route) => {
    setRoute(newRoute)
    setHistory((prev) => [...prev, newRoute])
    window.location.hash = encodeURIComponent(JSON.stringify(newRoute))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goBack = useCallback(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, -1)
      if (newHistory.length === 0) {
        setRoute({ page: 'home' })
        return [{ page: 'home' }]
      }
      setRoute(newHistory[newHistory.length - 1])
      return newHistory
    })
  }, [])

  return (
    <RouterContext.Provider value={{ route, navigate, goBack, history }}>
      {children}
    </RouterContext.Provider>
  )
}
