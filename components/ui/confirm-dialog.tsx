'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  /**
   * Si el diálogo está abierto
   */
  open: boolean;
  /**
   * Callback cuando el estado cambia
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback cuando el usuario confirma la acción
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Título del diálogo
   * @default "¿Estás seguro?"
   */
  title?: string;
  /**
   * Descripción de la acción destructiva
   * @default "Esta acción no se puede deshacer."
   */
  description?: string;
  /**
   * Texto del botón de confirmar
   * @default "Continuar"
   */
  confirmLabel?: string;
  /**
   * Texto del botón de cancelar
   * @default "Cancelar"
   */
  cancelLabel?: string;
  /**
   * Variante del botón de confirmar
   * @default "destructive"
   */
  variant?: 'destructive' | 'default';
  /**
   * Si está procesando la acción (muestra loading)
   */
  isLoading?: boolean;
}

/**
 * Componente ConfirmDialog para acciones destructivas
 * Wrapper estandarizado de AlertDialog
 * 
 * @example
 * const [open, setOpen] = useState(false);
 * const deleteMutation = useDeleteProduct();
 * 
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   onConfirm={() => deleteMutation.mutate(productId)}
 *   title="Eliminar Producto"
 *   description="Esta acción no se puede deshacer. El producto será eliminado permanentemente."
 *   confirmLabel="Eliminar"
 *   isLoading={deleteMutation.isPending}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '¿Estás seguro?',
  description = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  variant = 'destructive',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
