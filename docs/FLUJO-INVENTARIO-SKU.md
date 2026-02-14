# Flujo de Inventario y Gestión de SKU/Etiquetas

## Documento generado: 14 de febrero de 2026

## Resumen de la Integración

Se ha integrado exitosamente el módulo de etiquetas con el módulo principal de productos, permitiendo a los usuarios gestionar productos con o sin códigos de barras comerciales, generar SKUs únicos automáticamente y imprimir etiquetas térmicas desde cualquier punto del sistema.

---

## Arquitectura de la Solución

### Validaciones Centralizadas

**Archivo:** [lib/validators/product.ts](lib/validators/product.ts)

Se centralizaron todos los schemas de validación Zod en un único archivo:

- `productApiSchema`: Validación para API (usa tipos numéricos)
- `productUpdateApiSchema`: Validación parcial para actualizaciones
- `productFormSchema`: Validación para formularios cliente (usa strings)
- `productEditFormSchema`: Validación específica para edición
- `productCompactFormSchema`: Validación simplificada para flujo rápido

**Helpers incluidos:**
- `transformFormDataToApi()`: Convierte datos de formulario a formato API
- `transformCompactFormDataToApi()`: Conversión para formulario compacto

---

## Flujos de Usuario

### Escenario A: Producto CON Código de Barras Comercial

**Contexto:** Tiendas que venden productos con código de barras EAN-13, UPC-A, etc.

**Flujo:**

1. **Crear producto** ([/dashboard/products](app/dashboard/products/page.tsx))
   - Click en "Nuevo Producto"
   - Ingresar manualmente el código de barras en campo SKU (ej: `7804650001234`)
   - Completar datos: nombre, precio, stock
   - Guardar

2. **Uso en operaciones:**
   - POS: Scanner detecta el código → busca producto → agrega a venta
   - Actualización de stock: Scanner detecta código → edita stock

3. **Reimprimir etiqueta** (opcional):
   - Desde lista de productos: Click ícono impresora 🖨️
   - Desde edición de producto: Botón "Imprimir Etiqueta"

**Ventajas:**
- Compatibilidad con sistemas externos
- Facilita búsqueda en bases de datos de productos
- Estándar de la industria

---

### Escenario B: Producto SIN Código de Barras (Generación Automática)

**Contexto:** Productos artesanales, a granel, producción propia, sin etiqueta comercial.

**Flujo:**

1. **Crear producto con SKU generado** ([/dashboard/products](app/dashboard/products/page.tsx))
   - Click en "Nuevo Producto"
   - Click en botón ✨ "Generar SKU Automático"
   - Sistema genera SKU único (formato: `PROD-{timestamp}-{random}`)
   - Completar datos del producto
   - Guardar

2. **Imprimir etiqueta:**
   - Automáticamente aparece opción "Imprimir Etiqueta"
   - O desde lista: Click ícono impresora 🖨️
   - Vista previa muestra etiqueta 40mm x 30mm
   - Click "Imprimir Etiqueta" → envía a impresora térmica

3. **Etiquetar producto físico:**
   - Pegar etiqueta impresa en producto o vitrina
   - Producto queda trazable por SKU generado

4. **Uso futuro:**
   - Scanner lee el código de barras impreso
   - Sistema encuentra producto por SKU
   - Actualización de stock, ventas, etc.

**Ventajas:**
- Trazabilidad total del inventario
- No requiere códigos comerciales
- Control interno completo

---

### Escenario C: Carga Masiva Rápida (Flujo Optimizado)

**Contexto:** Inventario inicial, carga de múltiples productos nuevos, reposición.

**Flujo Rápido:** [/dashboard/products/labels](app/dashboard/products/labels/page.tsx)

#### Tab 1: "Buscar por Código"
**Para productos con código de barras:**

1. Escanear código de barras con pistola
2. **Si producto existe:**
   - Sistema muestra datos
   - Vista previa de etiqueta disponible
   - Opción de reimprimir

3. **Si producto NO existe:**
   - Sistema propone crear con ese SKU
   - Formulario compacto pre-llenado con SKU escaneado
   - Ingresar solo nombre + precio
   - Guardar → Vista previa → Imprimir

#### Tab 2: "Crear Sin Código"
**Para productos sin código de barras:**

1. Click "Generar SKU Aleatorio"
2. Sistema genera y muestra SKU único
3. Formulario compacto con SKU pre-llenado
4. Ingresar nombre + precio
5. Guardar → Vista previa → Imprimir
6. Repetir para siguiente producto

**Ventajas:**
- Optimizado para velocidad (menos campos)
- Ideal para operario de inventario
- Flujo lineal: Escanear/Generar → Crear → Imprimir → Siguiente

---

## Componentes Principales

### 1. ProductDialog (Crear Producto)
**Ruta:** [app/dashboard/products/_components/product-dialog.tsx](app/dashboard/products/_components/product-dialog.tsx)

**Características:**
- Formulario completo de creación
- Botón ✨ para generar SKU automático
- Se deshabilita si ya hay valor en SKU
- Validación con `productFormSchema`

**Uso:**
```tsx
<ProductDialog 
  open={isOpen}
  onOpenChange={setIsOpen}
  categories={categories}
/>
```

---

### 2. EditProductDialog (Editar Producto)
**Ruta:** [app/dashboard/products/_components/edit-product-dialog.tsx](app/dashboard/products/_components/edit-product-dialog.tsx)

**Características:**
- Formulario de edición completo
- **Advertencia al cambiar SKU:**
  - Alerta roja si SKU es modificado
  - Muestra SKU original
  - Sugiere crear producto nuevo si ya tiene etiquetas impresas
- Botón "Imprimir Etiqueta" en footer
- Validación con `productEditFormSchema`

**Advertencia implementada:**
```tsx
{skuChanged && (
  <Alert variant="destructive">
    ¡Atención! Cambiar el SKU puede afectar la trazabilidad...
  </Alert>
)}
```

---

### 3. ProductList (Lista de Productos)
**Ruta:** [app/dashboard/products/_components/product-list.tsx](app/dashboard/products/_components/product-list.tsx)

**Características:**
- Vista responsive (cards móvil, tabla desktop)
- Filtros: búsqueda, tipo, estado, categoría
- **Nueva columna "Acciones":**
  - Botón "Editar"
  - Botón ícono impresora 🖨️

**Vista Desktop:**
```
| Producto | SKU | Tipo | Precio | Stock | Estado | Acciones |
|----------|-----|------|--------|-------|--------|----------|
| Coca... | 780... | Producto | $1.500 | 45 | Activo | [Editar][🖨️] |
```

**Vista Móvil:**
- Cards con botones: [Editar] [🖨️ Etiqueta]

---

### 4. LabelPreview (Vista Previa de Etiqueta)
**Ruta:** [app/dashboard/products/_components/label-preview.tsx](app/dashboard/products/_components/label-preview.tsx)

**Características:**
- Renderiza `<ProductLabel />` escalado 1.5x para visualización
- Botón "Imprimir Etiqueta" con librería `react-to-print`
- Configuración de impresión:
  ```css
  @page { size: 40mm 30mm; margin: 0; }
  ```

**Props:**
```tsx
interface LabelPreviewProps {
  product: {
    name: string;
    price: number;
    sku: string;
  };
  organizationName: string;
}
```

---

### 5. ProductLabel (Componente de Etiqueta Física)
**Ruta:** [app/dashboard/products/_components/product-label.tsx](app/dashboard/products/_components/product-label.tsx)

**Características:**
- Dimensiones: **40mm x 30mm** (estándar térmico)
- Layout:
  - Header: Nombre de organización (8pt)
  - Producto: Nombre (10pt bold, max 2 líneas)
  - Precio: Formato CLP (18pt bold)
  - Footer: Código de barras o SKU texto

**Detección inteligente:**
- Si SKU parece código de barras (EAN-13, UPC, etc.): Renderiza barcode
- Si es SKU generado: Muestra texto monoespaciado

**Librería:** `react-barcode` para generación de códigos

---

### 6. LabelsContent (Flujo Rápido Cliente)
**Ruta:** [app/dashboard/products/labels/_components/labels-content.tsx](app/dashboard/products/labels/_components/labels-content.tsx)

**Características:**
- Component cliente con estado local
- Maneja tabs: "Buscar por Código" y "Crear Sin Código"
- Integración con API de búsqueda y generación

**Props:**
```tsx
interface LabelsContentProps {
  organizationName: string;
}
```

---

## APIs Utilizadas

### GET /api/products/generate-sku
**Genera SKU único garantizado**

**Response:**
```json
{
  "sku": "PROD-1676543210-X7K9"
}
```

**Lógica:**
- Formato: `PROD-{timestamp}-{random4chars}`
- Validación de unicidad por `organizationId`
- Hasta 10 intentos si hay colisión

---

### GET /api/products/search-by-sku?sku={value}
**Busca producto por SKU (normalizado)**

**Response (encontrado):**
```json
{
  "found": true,
  "product": { /* datos completos */ }
}
```

**Response (no encontrado):**
```json
{
  "found": false,
  "sku": "7804650001234"
}
```

---

### POST /api/products
**Crea nuevo producto**

**Validación:** `productApiSchema`

**Payload:**
```json
{
  "sku": "PROD-1676543210-X7K9",
  "name": "Producto ejemplo",
  "price": 1500,
  "type": "PRODUCT",
  "taxRate": 19,
  "trackInventory": false,
  "currentStock": 0,
  "isActive": true
}
```

---

## Utilidades

### lib/utils/generate-sku.ts
**Server-side (con Prisma):**
- `generateRandomSKU()`: Genera formato estándar
- `ensureUniqueSKU(organizationId)`: Garantiza unicidad
- `isLikelyBarcode(value)`: Detecta códigos comerciales
- `normalizeSKU(value)`: Limpia y formatea

### lib/utils/sku-helpers.ts
**Client-safe (sin Prisma):**
- Mismas funciones pero sin acceso a BD
- Para uso en componentes cliente

---

## Configuración de Impresión

### Impresoras Térmicas Compatibles

**Tamaño de etiqueta:** 40mm x 30mm

**Impresoras recomendadas:**
- Zebra GK420d / GK420t
- DYMO LabelWriter 450
- Brother QL-820NWB
- TSC TE200

### CSS de Impresión

```css
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
```

---

## Notas Técnicas

### Multi-Tenancy
- **Todas** las consultas filtran por `organizationId`
- SKU único por organización (permite duplicados entre tenants)
- `organizationName` se obtiene de base de datos en Server Components

### Patrones Utilizados
- **Server Components:** Fetch de datos, obtención de contexto
- **Client Components:** Interactividad, estado, formularios
- **BFF Pattern:** Route Handlers validan y procesan
- **Schema Sharing:** Zod centralizado para validación consistente

### Seguridad
- Todos los endpoints verifican autenticación (`auth()`)
- Validación de `organizationId` en sesión
- Solo roles ADMIN/OWNER pueden crear/editar productos
- SKU validado como único antes de guardar

---

## Testing Checklist

### Flujo A: Producto con Código Comercial
- [ ] Crear producto con código EAN-13
- [ ] Buscar producto por scanner en POS
- [ ] Actualizar stock escaneando código
- [ ] Reimprimir etiqueta desde lista
- [ ] Verificar que código de barras se renderiza en etiqueta

### Flujo B: Producto con SKU Generado
- [ ] Generar SKU automático en creación
- [ ] Verificar formato `PROD-{timestamp}-{random}`
- [ ] Imprimir etiqueta con SKU generado
- [ ] Escanear etiqueta impresa → encuentra producto
- [ ] Actualizar stock del producto

### Flujo C: Carga Masiva Rápida
- [ ] Escanear código existente → muestra producto
- [ ] Escanear código nuevo → permite crear
- [ ] Generar SKU → crear → imprimir → repetir 5 veces
- [ ] Verificar velocidad del flujo (< 30seg por producto)

### Advertencia de SKU
- [ ] Editar producto y cambiar SKU
- [ ] Verificar que aparece alerta roja
- [ ] Verificar que muestra SKU original
- [ ] Confirmar que permite guardar (no bloquea)

### Impresión
- [ ] Vista previa muestra organización correcta (no "Tendo Demo")
- [ ] Formato de precio: `$ 1.500` (CLP)
- [ ] Código de barras legible en etiqueta 40x30mm
- [ ] Impresión térmica sin márgenes

---

## Mejoras Futuras (Backlog)

### Corto Plazo
- ❌ Agregar validación de "producto tiene ventas" antes de permitir editar SKU
- ❌ Implementar TanStack Query para caché de productos
- ❌ Agregar opción de "cantidad de copias" en diálogo de impresión

### Mediano Plazo
- ❌ Soporte para códigos QR además de códigos de barras
- ❌ Importación masiva de productos desde CSV
- ❌ Plantillas de etiquetas personalizables por organización
- ❌ Historial de cambios de SKU (auditoría)

### Largo Plazo
- ❌ App móvil para inventario con scanner integrado
- ❌ Integración con balanzas electrónicas (productos a granel)
- ❌ IA para sugerencia de nombres de productos desde imagen

---

## Contacto y Soporte

**Documentación generada:** Fase 3 - Integración Productos/Etiquetas  
**Fecha:** 14 de febrero de 2026  
**Arquitecto:** GitHub Copilot (Claude Sonnet 4.5)

Para consultas sobre el flujo de inventario, referirse a:
- [lib/validators/product.ts](lib/validators/product.ts) - Schemas de validación
- [app/dashboard/products/](app/dashboard/products/) - Módulo principal
- [app/dashboard/products/labels/](app/dashboard/products/labels/) - Flujo rápido
