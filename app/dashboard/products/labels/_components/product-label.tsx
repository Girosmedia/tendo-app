'use client';

import { forwardRef } from 'react';
import Barcode from 'react-barcode';
import { isLikelyBarcode } from '@/lib/utils/sku-helpers';

interface ProductLabelProps {
  product: {
    name: string;
    price: number;
    sku: string;
  };
  organizationName: string;
}

export const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
  function ProductLabel({ product, organizationName }, ref) {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    };

    // Si el SKU parece código de barras, mostrarlo
    const showBarcode = isLikelyBarcode(product.sku);

    return (
      <div
        ref={ref}
        className="bg-white p-2"
        style={{
          width: '40mm',
          height: '30mm',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div className="h-full flex flex-col justify-between">
          {/* Header */}
          <div className="text-center">
            <p className="text-[8pt] font-semibold truncate">{organizationName}</p>
          </div>

          {/* Product Name */}
          <div className="flex-1 flex items-center justify-center px-1">
            <p className="text-[10pt] font-bold text-center line-clamp-2 leading-tight">
              {product.name}
            </p>
          </div>

          {/* Price */}
          <div className="text-center">
            <p className="text-[18pt] font-bold">{formatPrice(product.price)}</p>
          </div>

          {/* Barcode or SKU */}
          <div className="text-center">
            {showBarcode ? (
              <div className="flex justify-center">
                <Barcode
                  value={product.sku}
                  width={1}
                  height={20}
                  fontSize={6}
                  margin={0}
                  background="transparent"
                />
              </div>
            ) : (
              <p className="text-[6pt] font-mono">{product.sku}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
