import AdminShell from '@/components/bookstore/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
