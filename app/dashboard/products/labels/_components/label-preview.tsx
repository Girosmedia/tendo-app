'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ProductLabel } from './product-label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';

interface LabelPreviewProps {
  product: {
    name: string;
    price: number;
    sku: string;
  };
  organizationName: string;
}

export function LabelPreview({ product, organizationName }: LabelPreviewProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Etiqueta-${product.sku}`,
    pageStyle: `
      @page {
        size: 40mm 30mm;
        margin: 0;
      }
      @media print {
        body { 
          margin: 0;
          padding: 0;
        }
        html, body {
          width: 40mm;
          height: 30mm;
        }
      }
    `,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vista Previa de Etiqueta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview (escalado para visualización) */}
        <div className="flex justify-center">
          <div className="border-2 border-dashed border-muted-foreground/30 p-2 bg-muted/10">
            <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
              <ProductLabel 
                ref={labelRef} 
                product={product} 
                organizationName={organizationName} 
              />
            </div>
          </div>
        </div>

        {/* Print Button */}
        <Button onClick={handlePrint} className="w-full" size="lg">
          <Printer className="mr-2 h-5 w-5" />
          Imprimir Etiqueta
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Tamaño: 40mm x 30mm (estándar para impresoras térmicas)
        </p>
      </CardContent>
    </Card>
  );
}
