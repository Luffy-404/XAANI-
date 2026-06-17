import Home from '../../page'

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <Home initialRoute={{ page: 'book', slug }} />
}
