# Contexto del Proyecto: Tendo (Business Operating System)

## 1. Visión del Producto
**Tendo** es un SaaS modular de gestión comercial diseñado específicamente para **Pymes y pequeños Negocios Emprendedores en Chile**.
Su filosofía es ser un **Sistema Operativo Comercial** que comienza simple (gratuito o bajo costo) y crece junto con el negocio del cliente.

**Diferenciadores Clave:**
- **Simplicidad Radical ("Zimple"):** UX/UI diseñada para usuarios no tecnológicos. Lenguaje humano, botones claros, mobile-first.
- **Modularidad:** El sistema se adapta al rubro. No es lo mismo un almacén (Retail) que una constructora (Servicios). Tendo maneja ambos flujos mediante la activación de módulos.
- **Lenguaje cercano:** Se desarrolla considerando palabras cercanas y por sobre todo entendibles para los usuarios finales. Habla en el mismo idioma.

---

## 2. Arquitectura de Negocio y Roles

El sistema se divide en dos grandes niveles de acceso y administración:

### A. Nivel Super-Admin (Backoffice Tendo)
*Es la vista para la administración del SaaS (Nosotros).*
- **Gestión de Tenants (Inquilinos):** CRUD de empresas registradas.
- **Gestión de Suscripciones:** Control de planes, estados de pago (Activo/Moroso) y ciclo de vida del cliente.
- **Feature Flags (Módulos):** Capacidad de activar/desactivar módulos específicos (ej: "Activar Facturación", "Activar Cotizaciones") por Tenant individualmente.
- **Soporte/Impersonation:** Capacidad de acceder a la vista de un cliente para dar soporte técnico.
- **Métricas Globales:** MRR, Churn, Nuevos usuarios.

### B. Nivel Tenant (La Pyme)
*Es la vista operativa para el cliente final.*
- **Admin de Pyme:** Configura la empresa, logo, usuarios y roles (Vendedor, Contador, Supervisor).
- **Vendedor/Operario:** Acceso limitado a las funciones operativas (Vender, Cotizar, Inventariar) sin ver costos ni reportes sensibles.

---

## 3. Ecosistema de Módulos

El desarrollo debe ser **Modular**. No todas las tablas ni rutas deben estar accesibles para todos los tenants.

### 🟢 NÚCLEO (Core) - Obligatorio para todos
- **Dashboard:** KPIs en tiempo real (Ventas Hoy, Utilidad Real, Cuentas por Cobrar).
- **Configuración:** Perfil de empresa, gestión de usuarios.
- **Autenticación & Seguridad:** Login, Recuperación, Manejo de Sesiones (Auth.js).

### 🛒 TRACK RETAIL (Comercio)
*Para Almacenes, Botillerías, Tiendas.*
- **Punto de Venta (POS):** Interfaz de venta rápida, lector de código de barras, cálculo de vuelto.
- **Inventario Vivo:** Catálogo de Productos (Tangibles), control de Stock, Alertas de Quiebre.
- **Cierre de Caja (Z):** Arqueo de efectivo diario.

### 🛠️ TRACK SERVICIOS (Proyectos)
*Para Constructoras, Técnicos, Freelancers.*
- **Cotizador Profesional:** Creación de presupuestos (PDF) con Ítems de Servicio (Mano de Obra) y Materiales.
- **Gestión de Obras/Proyectos:**
    - Transformación de `Cotización Aprobada` -> `Proyecto Activo`.
    - Control de gastos vs. presupuesto.
- **Documentos Comerciales:** Flujo de estados: *Borrador -> Enviado -> Aprobado -> Cobrado*.

### 💰 APOYO TRANSVERSAL (Satélites)
- **Mi Caja (Finanzas):** Registro de Gastos Operacionales (Egresos de caja chica) para calcular la Utilidad Real.
- **Fiados (CRM Light clientes):** Gestión de Cuentas por Cobrar, base de datos de clientes, recordatorios de deuda.
- **Por Pagar (Proveedores):** Facturas pendientes de pago, servicios por pagar, etc.

---

## 4. Guías de Implementación Técnica

### Base de Datos (Schema Strategy)
- **Multi-tenant:** Todo registro debe tener `organizationId`.
- **Polimorfismo en Documentos:** Usar una estructura flexible para `Document` que pueda comportarse como "Venta" (Retail) o "Cotización" (Servicios) dependiendo del `type`.
- **Productos vs Servicios:** La tabla `Product` debe tener un discriminador `type: 'PRODUCT' | 'SERVICE'`. Los servicios no manejan stock físico.

### UX/UI Guidelines
- **Framework:** Shadcn/ui + Tailwind CSS.
- **Tema:**
    - Fondos: `Slate` (Dark/Light modes).
    - Brand: `Indigo` (Botones primarios).
    - Success/Money: `Emerald`.
    - Alert/Debt: `Rose`.
- **Localización:**
    - Moneda: CLP (Chilean Peso) `$ 1.500`.
    - Timezone: `America/Santiago` (Crítico para reportes diarios).
    - Idioma: Español de Chile (Evitar términos como "Payroll" o "Asset", usar "Sueldos" o "Activo").

### Stack Tecnológico Estricto
- **Frontend:** Next.js 14 (App Router), React Query, Zustand.
- **Backend:** Next.js Route Handlers (API BFF), Prisma ORM.
- **Validación:** Zod (Schema sharing entre front y back).

---

## 5. Instrucción para el Agente (Copilot)
Al generar código para Tendo:
1.  Verifica siempre si la funcionalidad pertenece al **Core**, al **Track Retail** o al **Track Servicios**.
2.  Asegura que las consultas a la DB filtren por `organizationId`.
3.  Prioriza la simplicidad visual. El usuario final no es experto en tecnología.
4.  Si se requiere una funcionalidad de administración global, ubícala bajo la ruta `/admin` (Super Admin), separada de `/dashboard` (Tenant).