import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Unauthorized</h1>
        <p className="text-sm text-muted-foreground mb-6">You do not have permission to access this page.</p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </main>
  )
}
