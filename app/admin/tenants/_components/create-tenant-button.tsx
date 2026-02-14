'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateTenantSheet } from './create-tenant-sheet'

export function CreateTenantButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo Tenant
      </Button>
      <CreateTenantSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
