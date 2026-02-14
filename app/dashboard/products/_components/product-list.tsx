'use client'

import { useState, useMemo } from 'react'
import { ProductType } from '@/lib/generated/prisma/client/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Package, Briefcase, AlertTriangle } from 'lucide-react'
import { formatPrice, isLowStock } from '@/lib/products'
import { Prisma } from '@/lib/generated/prisma/client/client'
import { EditProductDialog } from './edit-product-dialog'

type Product = {
  id: string
  name: string
  sku: string
  type: ProductType
  price: Prisma.Decimal
  currentStock: number
  minStock: number
  trackInventory: boolean
  isActive: boolean
  category?: {
    id: string
    name: string
  } | null
}

interface ProductListProps {
  products: Product[]
  categories: Array<{ id: string; name: string }>
}

export function ProductList({ products: initialProducts, categories }: ProductListProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Type filter
      if (typeFilter !== 'all' && product.type !== typeFilter) {
        return false
      }

      // Status filter
      if (statusFilter === 'active' && !product.isActive) return false
      if (statusFilter === 'inactive' && product.isActive) return false

      // Category filter
      if (categoryFilter !== 'all' && product.category?.id !== categoryFilter) {
        return false
      }

      return true
    })
  }, [initialProducts, search, typeFilter, statusFilter, categoryFilter])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PRODUCT">Productos</SelectItem>
                  <SelectItem value="SERVICE">Servicios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredProducts.length} productos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="size-8" />
                        <p>No se encontraron productos</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded bg-muted">
                            {product.type === 'PRODUCT' ? (
                              <Package className="size-5 text-muted-foreground" />
                            ) : (
                              <Briefcase className="size-5 text-muted-foreground" />
                            )}
                          </div>
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant={product.type === 'PRODUCT' ? 'default' : 'secondary'}>
                          {product.type === 'PRODUCT' ? 'Producto' : 'Servicio'}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.category?.name || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(Number(product.price))}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.trackInventory ? (
                          <div className="flex items-center justify-end gap-2">
                            {isLowStock(product.currentStock, product.minStock, product.trackInventory) && (
                              <AlertTriangle className="size-4 text-destructive" />
                            )}
                            <span className={isLowStock(product.currentStock, product.minStock, product.trackInventory) ? 'text-destructive font-semibold' : ''}>
                              {product.currentStock}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? 'success' : 'secondary'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingProductId(product.id)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingProductId && (
        <EditProductDialog
          productId={editingProductId}
          isOpen={!!editingProductId}
          onClose={() => setEditingProductId(null)}
          categories={categories}
        />
      )}
    </div>
  )
}
