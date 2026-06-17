const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

const XAANI_PRODUCTS = [
  {
    title: 'FAITH Tee - White',
    slug: 'xaani-faith-tee-white',
    author: 'XAANI',
    description: 'Faith is not the absence of doubt, but the decision to move forward despite it. Premium heavyweight 100% cotton with exclusive FAITH graphic print. Oversized fit. XAANI 2025.',
    price: 1499,
    discountPrice: null,
    stock: 50,
    image: '/images/products/faith-tee-white.jpg.jpeg',
    featured: true,
    rating: 4.9,
    categorySlug: 'streetwear',
  },
  {
    title: 'FAITH Tee - Maroon',
    slug: 'xaani-faith-tee-maroon',
    author: 'XAANI',
    description: 'Faith is not the absence of doubt, but the decision to move forward despite it. Premium heavyweight 100% cotton in rich maroon with exclusive FAITH graphic print. Oversized fit. XAANI 2025.',
    price: 1499,
    discountPrice: null,
    stock: 50,
    image: '/images/products/faith-tee-maroon.jpg.jpeg',
    featured: true,
    rating: 4.9,
    categorySlug: 'streetwear',
  },
  {
    title: 'SENSHI Samurai Tee',
    slug: 'xaani-senshi-samurai-tee',
    author: 'XAANI',
    description: 'A samurai walks with discipline, honor, and silence. Every scroll a lesson, every battle a step toward mastery. Strength is not loud — it is controlled. XAANI 2025.',
    price: 1699,
    discountPrice: null,
    stock: 50,
    image: '/images/products/senshi-tee.jpg.jpeg',
    featured: true,
    rating: 4.9,
    categorySlug: 'streetwear',
  },
  {
    title: 'Silent Dominance Tee',
    slug: 'xaani-silent-dominance-tee',
    author: 'XAANI',
    description: "Silence isn't weakness — it's control. Every move is calculated, every action intentional. Powerful men dominate quietly, while others seek attention. We build authority.",
    price: 1699,
    discountPrice: null,
    stock: 50,
    image: '/images/products/silent-dominance-tee.jpg.jpeg',
    featured: true,
    rating: 4.8,
    categorySlug: 'streetwear',
  },
  {
    title: 'XAANI Essential Oversized Tee Black',
    slug: 'xaani-essential-oversized-tee-black',
    author: 'XAANI',
    description: 'Everyday black oversized tee with a clean XAANI identity. Heavyweight cotton jersey, drop shoulders, and a relaxed streetwear fit.',
    price: 1299,
    discountPrice: null,
    stock: 65,
    image: '/images/products/silent-dominance-tee.jpg.jpeg',
    featured: true,
    rating: 4.7,
    categorySlug: 'streetwear',
  },
  {
    title: 'XAANI Essential Oversized Tee White',
    slug: 'xaani-essential-oversized-tee-white',
    author: 'XAANI',
    description: 'Crisp white oversized essential tee with subtle XAANI styling. Heavy cotton, boxy profile, and a clean everyday finish.',
    price: 1299,
    discountPrice: null,
    stock: 65,
    image: '/images/products/faith-tee-white.jpg.jpeg',
    featured: true,
    rating: 4.7,
    categorySlug: 'streetwear',
  },
  {
    title: 'XAANI Utility Hoodie Black',
    slug: 'xaani-utility-hoodie-black',
    author: 'XAANI',
    description: 'Black utility hoodie with a substantial fleece body, roomy hood, kangaroo pocket, and relaxed XAANI streetwear proportions.',
    price: 2499,
    discountPrice: null,
    stock: 40,
    image: '/images/placeholders/hoodies/hoodie-black.webp',
    featured: true,
    rating: 4.8,
    categorySlug: 'hoodies',
  },
  {
    title: 'XAANI Utility Hoodie Charcoal',
    slug: 'xaani-utility-hoodie-charcoal',
    author: 'XAANI',
    description: 'Charcoal utility hoodie in soft heavyweight fleece. Relaxed fit, ribbed trims, and practical everyday XAANI styling.',
    price: 2499,
    discountPrice: null,
    stock: 38,
    image: '/images/placeholders/hoodies/hoodie-charcoal.webp',
    featured: false,
    rating: 4.6,
    categorySlug: 'hoodies',
  },
  {
    title: 'XAANI Varsity Jacket Black',
    slug: 'xaani-varsity-jacket-black',
    author: 'XAANI',
    description: 'Black varsity jacket with a structured streetwear fit, ribbed collar and cuffs, snap closure, and bold outerwear attitude.',
    price: 3999,
    discountPrice: null,
    stock: 24,
    image: '/images/placeholders/jackets/varsity-black.webp',
    featured: true,
    rating: 4.9,
    categorySlug: 'jackets',
  },
  {
    title: 'XAANI Utility Bomber Jacket Black',
    slug: 'xaani-utility-bomber-jacket-black',
    author: 'XAANI',
    description: 'Black utility bomber jacket with a clean front profile, ribbed trims, and a premium transitional streetwear shape.',
    price: 3499,
    discountPrice: null,
    stock: 28,
    image: '/images/placeholders/jackets/bomber-black.webp',
    featured: false,
    rating: 4.6,
    categorySlug: 'jackets',
  },
]

const categories = [
  { name: 'Men', slug: 'men', image: '/images/products/faith-tee-white.jpg.jpeg' },
  { name: 'Streetwear', slug: 'streetwear', image: '/images/products/senshi-tee.jpg.jpeg' },
  { name: 'Hoodies', slug: 'hoodies', image: '/images/placeholders/hoodies/hoodie-black.webp' },
  { name: 'Jackets', slug: 'jackets', image: '/images/placeholders/jackets/varsity-black.webp' },
]

async function main() {
  console.log('Seeding XAANI catalog...')

  const adminPassword = await hash('admin123', 12)
  const customerPassword = await hash('customer123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@xaani.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@xaani.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: { role: 'CUSTOMER' },
    create: {
      email: 'customer@example.com',
      name: 'Maya Customer',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  })

  await prisma.cartItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.book.deleteMany()
  await prisma.category.deleteMany()

  const categoryRecords = {}
  for (const category of categories) {
    const record = await prisma.category.create({ data: category })
    categoryRecords[category.slug] = record.id
  }

  for (const product of XAANI_PRODUCTS) {
    await prisma.book.create({
      data: {
        title: product.title,
        slug: product.slug,
        author: product.author,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        image: product.image,
        imageUrl: product.image,
        featured: product.featured,
        published: true,
        rating: product.rating,
        categoryId: categoryRecords[product.categorySlug],
      },
    })
  }

  console.log(`Seeded users: ${admin.email}, ${customer.email}`)
  console.log(`Seeded ${categories.length} categories and ${XAANI_PRODUCTS.length} XAANI products.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
