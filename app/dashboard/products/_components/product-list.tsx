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
import { ResponsiveTable, ResponsiveTableMinWidth } from '@/components/ui/responsive-table'
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
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
                <Package className="size-12" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header with icon and name */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                            {product.type === 'PRODUCT' ? (
                              <Package className="size-6 text-muted-foreground" strokeWidth={1.75} />
                            ) : (
                              <Briefcase className="size-6 text-muted-foreground" strokeWidth={1.75} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{product.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                          </div>
                        </div>
                        <Badge variant={product.isActive ? 'success' : 'secondary'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Tipo</p>
                          <Badge variant={product.type === 'PRODUCT' ? 'default' : 'secondary'} className="mt-1">
                            {product.type === 'PRODUCT' ? 'Producto' : 'Servicio'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Categoría</p>
                          <p className="font-medium mt-1">{product.category?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Precio</p>
                          <p className="font-bold text-lg text-brand-success mt-1">
                            {formatPrice(Number(product.price))}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Stock</p>
                          {product.trackInventory ? (
                            <div className="flex items-center gap-1 mt-1">
                              {isLowStock(product.currentStock, product.minStock, product.trackInventory) && (
                                <AlertTriangle className="size-4 text-destructive" strokeWidth={2} />
                              )}
                              <span className={`font-semibold ${isLowStock(product.currentStock, product.minStock, product.trackInventory) ? 'text-destructive' : ''}`}>
                                {product.currentStock}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground mt-1 block">-</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full h-11"
                        onClick={() => setEditingProductId(product.id)}
                      >
                        Editar Producto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <ResponsiveTable>
              <ResponsiveTableMinWidth minWidth="800px">
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
              </ResponsiveTableMinWidth>
            </ResponsiveTable>
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
