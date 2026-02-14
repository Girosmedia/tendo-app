import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ProductList } from './_components/product-list'
import { ProductsHeader } from './_components/products-header'

async function getProducts() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/products`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  })

  if (!response.ok) {
    console.error('Error fetching products:', response.statusText)
    return []
  }

  const data = await response.json()
  return data.products || []
}

async function getCategories() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/categories`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  })

  if (!response.ok) {
    console.error('Error fetching categories:', response.statusText)
    return []
  }

  const data = await response.json()
  return data.categories || []
}

export const metadata = {
  title: 'Productos y Servicios | Tendo',
  description: 'Gestión de catálogo de productos y servicios',
}

export default async function ProductsPage() {
  const session = await auth()

  if (!session?.user?.organizationId) {
    redirect('/login')
  }

  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <ProductsHeader categories={categories} />
      <ProductList products={products} categories={categories} />
    </div>
  )
}
