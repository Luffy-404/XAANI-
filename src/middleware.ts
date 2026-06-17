import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function isAdminRole(role: unknown) {
  return String(role ?? '').toUpperCase() === 'ADMIN'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  })

  if (pathname === '/admin') {
    const url = request.nextUrl.clone()
    if (!token) {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    url.pathname = isAdminRole(token.role) ? '/admin/dashboard' : '/unauthorized'
    return NextResponse.redirect(url)
  }

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (!isAdminRole(token.role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
