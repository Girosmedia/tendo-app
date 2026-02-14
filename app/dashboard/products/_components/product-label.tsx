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

    const getBarcodeFormat = (sku: string): 'EAN13' | 'CODE128' => {
      const clean = sku.trim();
      if (/^\d{13}$/.test(clean)) return 'EAN13';
      return 'CODE128';
    };

    const barcodeFormat = getBarcodeFormat(product.sku);

    // Calcular ancho de barras según largo del SKU para que siempre quepa
    const barcodeWidth = product.sku.length > 15 ? 0.7 : product.sku.length > 10 ? 0.85 : 1.1;

    return (
      <div
        ref={ref}
        style={{
          width: '50mm',
          height: '40mm',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffffff',
          padding: '2.5mm 3mm',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e5e7eb',
          borderRadius: '3px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          pageBreakInside: 'avoid' as const,
        }}
      >
        {/* Header: logo */}
        {organizationLogo && (
          <div style={{ textAlign: 'center', paddingBottom: '1.5mm' }}>
            <img
              src={organizationLogo}
              alt="Logo"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Nombre del producto */}
        <p
          style={{
            fontSize: '10pt',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            lineHeight: '1.2',
            margin: '0 0 1mm 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {product.name}
        </p>

        {/* Precio */}
        <p
          style={{
            fontSize: '18pt',
            fontWeight: '900',
            color: '#059669',
            textAlign: 'center',
            margin: '1mm 0',
            letterSpacing: '-0.02em',
          }}
        >
          {formatPrice(product.price)}
        </p>

        {/* Spacer flexible */}
        <div style={{ flex: 1 }} />

        {/* Código de Barras - contenido en un wrapper que escala si es necesario */}
        <div
          style={{
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              transform: product.sku.length > 20 ? 'scaleX(0.85)' : 'none',
              transformOrigin: 'center',
            }}
          >
            <Barcode
              value={product.sku}
              format={barcodeFormat}
              width={barcodeWidth}
              height={16}
              fontSize={6}
              margin={0}
              background="transparent"
              displayValue={true}
              textMargin={1}
              fontOptions="bold"
            />
          </div>
        </div>

        {/* Nombre de empresa */}
        <p
          style={{
            fontSize: '5.5pt',
            fontWeight: '400',
            color: '#9ca3af',
            textAlign: 'center',
            margin: '1mm 0 0 0',
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
    );
  }
);
