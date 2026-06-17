import BooksManagementClient from './BooksManagementClient'
import { db } from '@/lib/db'

export default async function AdminBooksPage() {
  const [books, categories] = await Promise.all([
    db.book.findMany({
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    }),
    db.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <BooksManagementClient
      books={books.map((book) => ({
        id: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        description: book.description,
        categoryId: book.categoryId,
        category: {
          id: book.category.id,
          name: book.category.name,
          slug: book.category.slug,
        },
        price: book.price,
        discountPrice: book.discountPrice,
        stock: book.stock,
        imageUrl: book.imageUrl || book.image,
        featured: book.featured,
        published: book.published,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
      }))}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }))}
    />
  )
}
