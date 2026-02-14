'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarcodeScanner } from './_components/barcode-scanner';
import { LabelPreview } from './_components/label-preview';
import { ProductFormCompact } from './_components/product-form-compact';
import { Sparkles, AlertCircle, CheckCircle2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductLabelsPage() {
  const [mode, setMode] = useState<'scan' | 'create'>('scan');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    product?: any;
    sku?: string;
  } | null>(null);
  const [generatedSKU, setGeneratedSKU] = useState('');
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  // Datos de la organización (normalmente vendrían de una API o contexto)
  const organizationName = 'Tendo Demo'; // TODO: Obtener de sesión/contexto

  async function handleScan(sku: string) {
    setIsSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/products/search-by-sku?sku=${encodeURIComponent(sku)}`);
      
      if (!res.ok) {
        throw new Error('Error al buscar producto');
      }

      const data = await res.json();
      setSearchResult(data);

      if (data.found) {
        toast.success('Producto encontrado');
        setPreviewProduct(data.product);
      } else {
        toast.info('Producto no encontrado - Puedes crearlo');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al buscar producto');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGenerateSKU() {
    try {
      const res = await fetch('/api/products/generate-sku');
      
      if (!res.ok) {
        throw new Error('Error al generar SKU');
      }

      const data = await res.json();
      setGeneratedSKU(data.sku);
      toast.success('SKU generado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar SKU');
    }
  }

  function handleProductCreated(product: any) {
    setPreviewProduct(product);
    toast.success('Ahora puedes imprimir la etiqueta');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Tag className="h-8 w-8" />
          Etiquetas de Productos
        </h1>
        <p className="text-muted-foreground mt-1">
          Genera e imprime etiquetas con código de barras para tus productos
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'scan' | 'create')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="scan">🔍 Buscar por Código</TabsTrigger>
          <TabsTrigger value="create">➕ Crear Sin Código</TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Buscar por Código de Barras */}
        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Escanear Código de Barras</CardTitle>
              <CardDescription>
                Escanea o escribe el código de barras del producto. Si existe, podrás editarlo e imprimir su etiqueta.
                Si no existe, podrás crearlo con ese código.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarcodeScanner onScan={handleScan} disabled={isSearching} />

              {/* Resultado de Búsqueda */}
              {searchResult && (
                <div className="mt-4">
                  {searchResult.found ? (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Producto encontrado:</strong> {searchResult.product.name}
                        <br />
                        <span className="text-sm">SKU: {searchResult.product.sku}</span>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200">
                        <strong>Producto no encontrado</strong>
                        <br />
                        <span className="text-sm">SKU buscado: {searchResult.sku}</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario de Creación si NO se encontró */}
          {searchResult && !searchResult.found && searchResult.sku && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProductFormCompact 
                initialSKU={searchResult.sku} 
                onSuccess={handleProductCreated}
              />
              
              {previewProduct && (
                <LabelPreview 
                  product={previewProduct} 
                  organizationName={organizationName} 
                />
              )}
            </div>
          )}

          {/* Vista Previa si se encontró */}
          {searchResult && searchResult.found && searchResult.product && (
            <LabelPreview 
              product={searchResult.product} 
              organizationName={organizationName} 
            />
          )}
        </TabsContent>

        {/* Pestaña 2: Crear Sin Código de Barras */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generar SKU Único</CardTitle>
              <CardDescription>
                Para productos sin código de barras comercial, genera un SKU único automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateSKU}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generar SKU Aleatorio
                </Button>
              </div>

              {generatedSKU && (
                <Alert>
                  <AlertDescription>
                    <strong>SKU generado:</strong>
                    <code className="block mt-2 p-2 bg-muted rounded font-mono text-sm">
                      {generatedSKU}
                    </code>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {generatedSKU && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProductFormCompact 
                initialSKU={generatedSKU} 
                onSuccess={handleProductCreated}
              />
              
              {previewProduct && (
                <LabelPreview 
                  product={previewProduct} 
                  organizationName={organizationName} 
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
