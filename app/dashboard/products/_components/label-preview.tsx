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
  organizationLogo?: string | null;
}

export function LabelPreview({ product, organizationName, organizationLogo }: LabelPreviewProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Etiqueta-${product.sku}`,
    pageStyle: `
      @page {
        size: 50mm 40mm;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          width: 50mm;
          height: 40mm;
          overflow: hidden;
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
        {/* Preview con overflow controlado */}
        <div className="flex justify-center overflow-hidden">
          <ProductLabel 
            ref={labelRef} 
            product={product} 
            organizationName={organizationName}
            organizationLogo={organizationLogo}
          />
        </div>

        {/* Print Button */}
        <Button onClick={handlePrint} className="w-full" size="lg">
          <Printer className="mr-2 h-5 w-5" />
          Imprimir Etiqueta
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Tamaño: 50mm x 40mm
        </p>
      </CardContent>
    </Card>
  );
}
