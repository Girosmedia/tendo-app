# Manual de Estilo & Design System: TENDO v1.0 (Zimple)

## 🎨 Visión e Identidad Visual

**Tendo** es un Sistema Operativo Comercial para Pymes chilenas. La estética se define como **"Zimple"**: Simplicidad radical, lenguaje humano y una UX diseñada para usuarios no tecnológicos.

### Concepto Visual
> "El software que se siente como un aliado, no como una carga"

### Personalidad de Marca
- **Confiable** → Indigo (#4F46E5)
- **Exitoso** → Emerald (#10B981)
- **Cercano** → Mobile-First Design

---

## 🎨 Design Tokens

### Paleta de Colores Semántica

```css
/* Acciones de Negocio */
--color-brand-primary: #4F46E5;    /* Indigo: Crecimiento, acciones principales */
--color-brand-success: #10B981;    /* Emerald: Dinero, utilidad, éxito */
--color-brand-alert: #F43F5E;      /* Rose: Deudas, stock bajo, alertas */

/* Superficies */
--color-slate-50: #F8FAFC;         /* Fondo App (Light Mode) */
--color-slate-900: #0F172A;        /* Fondo App (Dark Mode/Sidebars) */
```

### Geometría y Profundidad (Zimple Style)

```css
/* Bordes Suaves y Amigables */
--radius-tendo: 1rem;              /* 16px - Esquinas redondeadas */

/* Sombras Sutiles */
--shadow-tendo: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
```

### Tipografía

```css
--font-sans: "Inter", "Geist", system-ui, sans-serif;
```

**Pesos Recomendados:**
- Títulos: `font-semibold` (600)
- Cuerpo: `font-normal` (400)
- Botones CTA: `font-medium` (500)

---

## 📱 Estrategia Mobile-First

### Principios de Diseño Responsive

1. **Touch Targets Generosos**
   - Altura mínima: **44px** (para uso con el pulgar)
   - Botones de acción principal: **56px (h-14)**
   - Botones grandes (POS): **64px (h-16)**

2. **Navegación Móvil**
   - **Bottom TabBar** persistente con 4 secciones principales
   - Altura: 64px (h-16) con padding seguro
   - Iconos Lucide con `strokeWidth={1.75}`

3. **Grid Adaptativo**
   ```tsx
   // Mobile: 1 columna
   // Tablet: 2 columnas
   // Desktop: 4 columnas (Bento Grid)
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
   ```

4. **Diálogos y Modales**
   - **Móvil**: Usar `Sheet` (emergen desde abajo)
   - **Desktop**: Usar `Dialog` (centrados)

---

## 🧩 Componentes UI (Shadcn/ui Personalizado)

### Button Component

```tsx
import { Button } from '@/components/ui/button'

// Variantes disponibles
<Button variant="default">Acción Principal</Button>
<Button variant="success">Cobrar</Button>
<Button variant="destructive">Eliminar</Button>

// Tamaños (Touch-friendly)
<Button size="default">Normal (44px)</Button>
<Button size="lg">Grande (56px)</Button>
<Button size="xl">Extra Grande (64px)</Button>

// Ejemplo: Botón Cobrar (POS)
<Button 
  size="lg" 
  variant="success"
  className="w-full"
>
  Cobrar $ {formatCurrency(total)}
</Button>
```

**Comportamiento de Hover:**
- `default`, `destructive`, `warning`, `info`: Translate + Shadow
- `success`: Scale (hover:scale-[1.02]) — Usado para acciones de dinero

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Ventas del Día</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

**Características:**
- Border: `border-slate-100` (light) / `border-slate-800` (dark)
- Shadow: `shadow-tendo` (profundidad sutil)
- Radius: `rounded-[--radius-tendo]` (16px)

### Input Component

```tsx
import { Input } from '@/components/ui/input'

// Altura ajustada para touch (44px)
<Input 
  type="text" 
  placeholder="RUT del cliente"
  className="h-11"
/>
```

---

## 🌍 Localización Chilena

### Glosario de Términos (Lenguaje Zimple)

```tsx
import { GLOSSARY_CL, formatCLP } from '@/lib/i18n/glossary'

// Usar términos chilenos en lugar de técnicos
❌ "Balance"          → ✅ "Plata en Caja"
❌ "Accounts Receivable" → ✅ "Fiados"
❌ "Payroll"          → ✅ "Sueldos"
❌ "Assets"           → ✅ "Activos"
```

### Formato de Moneda (CLP)

```tsx
import { formatCurrency } from '@/lib/utils/dashboard-helpers'

// Formato: $ 1.500 (sin decimales)
formatCurrency(1500) // "$ 1.500"
```

**Reglas:**
- **NO** usar decimales (`.00`)
- Separador de miles: punto (`.`)
- Símbolo pesos: `$` con espacio

### Zona Horaria

```tsx
import { CHILE_TIMEZONE } from '@/lib/utils/dashboard-helpers'

// Todos los reportes deben usar 'America/Santiago'
const now = toZonedTime(new Date(), CHILE_TIMEZONE)
```

---

## 🎯 Patrones de Diseño por Módulo

### Dashboard (Core)

**Layout Bento Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        Ventas Hoy
        <DollarSign className="h-5 w-5 text-brand-success" strokeWidth={1.75} />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-semibold text-brand-success">
        {formatCurrency(salesTotal)}
      </p>
    </CardContent>
  </Card>
</div>
```

### POS (Track Retail)

**Botón Cobrar (Acción Principal):**
```tsx
<Button 
  size="xl" 
  variant="success"
  className="w-full rounded-lg"
  onClick={handleCheckout}
>
  <DollarSign className="mr-2" strokeWidth={2} />
  Cobrar {formatCurrency(total)}
</Button>
```

**Características:**
- Color: `bg-brand-success` (#10B981)
- Tamaño: `h-16` (64px) — Extra grande para touch
- Animación: `hover:scale-[1.02]`
- Radius: `rounded-lg` (12px)

### Inventario (Track Retail)

**DataTable con Badges de Estado:**
```tsx
import { Badge } from '@/components/ui/badge'

// Stock Bajo
<Badge variant="destructive" className="bg-brand-alert">
  Stock Bajo
</Badge>

// Stock OK
<Badge variant="success" className="bg-brand-success">
  Disponible
</Badge>
```

---

## 🧭 Navegación

### Mobile TabBar (< 768px)

```tsx
import { MobileTabBar } from '@/app/dashboard/_components/mobile-tabbar'

// Agregado automáticamente en DashboardLayout
// Tabs: Inicio | Ventas | Inventario | Más
```

**Iconos y Labels:**
- **Inicio**: `Home` → Dashboard principal
- **Ventas**: `ShoppingCart` → POS
- **Inventario**: `Package` → Productos
- **Más**: `MoreHorizontal` → Settings, Clientes, Fiados, Team

### Desktop Sidebar (≥ 768px)

- Se mantiene el `AppSidebar` actual con navegación completa
- El TabBar se oculta automáticamente (`md:hidden`)

---

## 🎨 Paleta de Colores Completa

### Light Mode
```css
--background: oklch(0.99 0 0);          /* Casi blanco */
--foreground: oklch(0.20 0 0);          /* Casi negro */
--primary: oklch(0.485 0.14 264);       /* Indigo */
--success: oklch(0.55 0.13 155);        /* Emerald */
--destructive: oklch(0.58 0.15 15);     /* Rose */
--warning: oklch(0.68 0.14 65);         /* Amber */
--info: oklch(0.55 0.12 230);           /* Blue */
--border: oklch(0.93 0 0);              /* Gris suave */
```

### Dark Mode
```css
--background: oklch(0.16 0.01 264);     /* Slate oscuro */
--foreground: oklch(0.985 0 0);         /* Casi blanco */
--primary: oklch(0.62 0.16 264);        /* Indigo brillante */
--success: oklch(0.65 0.14 155);        /* Emerald brillante */
--destructive: oklch(0.68 0.16 15);     /* Rose suave */
--border: oklch(1 0 0 / 10%);           /* Transparente */
```

**Nota:** Se prioriza el **Modo Claro** por defecto para legibilidad en ambientes de trabajo (almacenes/obras).

---

## 📐 Espaciado y Layout

### Sistema de Spacing (Tailwind)

```tsx
// Padding de Cards
<Card className="p-6">  // 24px padding interno

// Gaps en Grids
<div className="grid gap-6">  // 24px entre elementos

// Contenedor principal
<div className="space-y-8 p-4 md:p-8">  // Mobile: 16px, Desktop: 32px
```

### Safe Areas (iOS)

```css
/* MobileTabBar incluye safe-area-inset-bottom */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 🔧 Implementación Técnica

### Archivo de Tokens (globals.css)

```css
@import "tailwindcss";

@theme inline {
  --color-brand-primary: #4F46E5;
  --color-brand-success: #10B981;
  --color-brand-alert: #F43F5E;
  --radius-tendo: 1rem;
  --shadow-tendo: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  --font-sans: "Inter", "Geist", system-ui, sans-serif;
}
```

### Uso en Componentes

```tsx
// Usar clases de Tailwind CSS v4
<div className="rounded-[--radius-tendo] shadow-[--shadow-tendo] bg-slate-50">
  {/* Contenido */}
</div>

// Usar variables semánticas
<Button className="bg-brand-primary hover:bg-brand-primary/90">
  Acción Principal
</Button>
```

---

## ✅ Checklist de Implementación

### Fase 1: Fundamentos ✅
- [x] Design Tokens en `globals.css`
- [x] Radius ajustado a 1rem
- [x] Button actualizado (touch targets)
- [x] Card actualizado (shadow-tendo)

### Fase 2: Localización ✅
- [x] Glosario chileno (`lib/i18n/glossary.ts`)
- [x] `formatCurrency` sin decimales
- [x] Zona horaria `America/Santiago`

### Fase 3: Mobile-First ✅
- [x] MobileTabBar component
- [x] Integración en DashboardLayout
- [x] Padding-bottom en contenido móvil

### Fase 4: Componentes Operativos ✅
- [x] Rediseñar POS con botones Emerald
- [x] Actualizar Dashboard con Bento Grid
- [x] Actualizar componentes de Fiados
- [x] Actualizar componentes de Inventario

### Fase 5: Optimización Móvil Completa ✅
- [x] Convertir Dialogs a ResponsiveDialog (Sheets en móvil)
- [x] Implementar ResponsiveTable con scroll horizontal
- [x] Aplicar CurrencyInput/NumericInput a todos los inputs de moneda
- [x] Optimizar todas las tablas para móvil (6 vistas)
- [x] Optimizar todos los diálogos para móvil (5 diálogos)

---

## 📚 Referencias

### Documentación
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [Radix UI](https://www.radix-ui.com)

### Archivos Clave
- [`app/globals.css`](../app/globals.css) — Design Tokens
- [`components/ui/button.tsx`](../components/ui/button.tsx) — Button Component
- [`components/ui/card.tsx`](../components/ui/card.tsx) — Card Component
- [`lib/i18n/glossary.ts`](../lib/i18n/glossary.ts) — Localización
- [`app/dashboard/_components/mobile-tabbar.tsx`](../app/dashboard/_components/mobile-tabbar.tsx) — Mobile Nav

---

## 🎯 Instrucciones para el Equipo

Al implementar nuevas funcionalidades, recuerda:

1. **Usa los Design Tokens** definidos en `globals.css`
2. **Prioriza Mobile-First**: Diseña primero para pantallas pequeñas
3. **Touch Targets**: Mínimo 44px de altura para elementos interactivos
4. **Lenguaje Chileno**: Usa el glosario en `lib/i18n/glossary.ts`
5. **Formato Moneda**: Siempre sin decimales (`formatCurrency`)
6. **Iconos Lucide**: strokeWidth={1.75} para consistencia
7. **Radius**: Usar `rounded-[--radius-tendo]` o clases equivalentes

---

**Versión:** 1.0  
**Última Actualización:** 14 de febrero de 2026  
**Autor:** Equipo Tendo + Directora de Arte
