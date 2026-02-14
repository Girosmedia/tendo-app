'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, FolderTree } from 'lucide-react'
import { ProductDialog } from './product-dialog'
import { CategoryDialog } from './category-dialog'

interface ProductsHeaderProps {
  categories: Array<{ id: string; name: string }>
}

export function ProductsHeader({ categories }: ProductsHeaderProps) {
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos y Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona tu catálogo completo de productos físicos y servicios
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full md:w-auto" 
            onClick={() => setCategoryDialogOpen(true)}
          >
            <FolderTree className="mr-2 size-4" />
            Nueva Categoría
          </Button>
          <Button 
            size="lg" 
            className="w-full md:w-auto" 
            onClick={() => setProductDialogOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        categories={categories}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
      />
    </>
  )
}
