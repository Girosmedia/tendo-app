'use client';

import { forwardRef } from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
  product: {
    name: string;
    price: number;
    sku: string;
  };
  organizationName: string;
  organizationLogo?: string | null;
}

export const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
  function ProductLabel({ product, organizationName, organizationLogo }, ref) {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    };

    // Determinar el formato de código de barras según el SKU
    const getBarcodeFormat = (sku: string): 'EAN13' | 'CODE128' => {
      const clean = sku.trim();
      // EAN-13: 13 dígitos
      if (/^\d{13}$/.test(clean)) return 'EAN13';
      // Para cualquier otro formato, usar CODE128 (soporta alfanuméricos)
      return 'CODE128';
    };

    const barcodeFormat = getBarcodeFormat(product.sku);

    return (
      <div
        ref={ref}
        style={{
          width: '50mm',
          height: '40mm',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffffff',
          padding: '3mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid #e5e7eb',
          borderRadius: '3px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header con logo destacado */}
        {organizationLogo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '2mm',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <img
              src={organizationLogo}
              alt="Logo"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Nombre del producto */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '2mm',
            paddingBottom: '2mm',
          }}
        >
          <p
            style={{
              fontSize: '12pt',
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              lineHeight: '1.2',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}
          >
            {product.name}
          </p>
        </div>

        {/* Precio */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: '2mm',
            paddingBottom: '2mm',
            borderTop: '1px solid #f3f4f6',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <p
            style={{
              fontSize: '22pt',
              fontWeight: '900',
              color: '#059669',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {formatPrice(product.price)}
          </p>
        </div>

        {/* Código de Barras */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: '2mm',
            paddingBottom: '1mm',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Barcode
              value={product.sku}
              format={barcodeFormat}
              width={1.2}
              height={18}
              fontSize={8}
              margin={0}
              background="transparent"
              displayValue={true}
              textMargin={1}
              fontOptions="bold"
            />
          </div>
        </div>

        {/* Nombre de empresa pequeño al final */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: '1mm',
          }}
        >
          <p
            style={{
              fontSize: '6pt',
              fontWeight: '400',
              color: '#9ca3af',
              margin: 0,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {organizationName}
          </p>
        </div>
      </div>
    );
  }
);
