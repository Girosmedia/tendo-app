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
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Productos y Servicios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tu catálogo completo de productos físicos y servicios
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button 
            variant="outline" 
            size="default"
            className="w-full md:w-auto md:size-lg" 
            onClick={() => setCategoryDialogOpen(true)}
          >
            <FolderTree className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Nueva Categoría
          </Button>
          <Button 
            size="default"
            className="w-full md:w-auto md:size-lg" 
            onClick={() => setProductDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
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
