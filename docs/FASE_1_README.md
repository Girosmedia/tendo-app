# Tendo - Sistema de Gestión para Pymes

## 🎯 Fase 1: Núcleo Multi-tenant y Autenticación ✅

### Stack Tecnológico

- **Framework**: Next.js 16.1.6 (App Router)
- **Base de Datos**: PostgreSQL + Prisma ORM 7.4.0
- **Autenticación**: Auth.js v5 (Next-Auth beta)
- **UI**: Shadcn/UI + Tailwind CSS v4
- **Validación**: Zod
- **Formularios**: React Hook Form
- **Hashing**: bcrypt

### Estructura del Proyecto

```
tendo/
├── prisma/
│   ├── schema.prisma           # Modelo multi-tenant
│   └── migrations/             # Migraciones de BD
├── prisma.config.ts            # Configuración Prisma 7
├── proxy.ts                    # Protección de rutas (Next.js 16+)
├── auth.config.ts              # Auth.js (Edge compatible)
├── auth.ts                     # Auth.js con callbacks
├── lib/
│   ├── db.ts                   # Cliente Prisma con adaptador
│   ├── utils.ts                # Utilidades Shadcn
│   ├── validators/
│   │   └── auth.ts             # Schemas Zod
│   └── utils/
│       ├── rut-validator.ts    # Validación RUT chileno
│       └── slugify.ts          # Generador de slugs
├── components/ui/              # Componentes Shadcn
├── app/
│   ├── (auth)/
│   │   ├── login/              # Inicio de sesión
│   │   ├── register/           # Registro de usuario
│   │   └── onboarding/         # Primera organización
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Layout con Sidebar
│   │   ├── dashboard/          # Panel principal
│   │   └── _components/
│   │       └── app-sidebar.tsx # Navegación lateral
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/  # Endpoints Auth.js
│       │   └── register/       # Registro de usuarios
│       └── organizations/      # CRUD organizaciones
└── types/
    └── next-auth.d.ts          # Tipos extendidos Auth.js
```

### Base de Datos

#### Modelos Principales

**User**
- Email único
- Password hasheado (bcrypt)
- currentOrganizationId (organización activa)

**Organization**
- Nombre, slug único, RUT único
- Representa a la Pyme (Tenant)

**Member**
- Relación User ↔ Organization
- Roles: OWNER, ADMIN, MEMBER
- Un usuario puede pertenecer a múltiples organizaciones

### Flujo de Usuario

1. **Registro** (`/register`)
   - Usuario crea cuenta con email/password
   - Login automático después del registro

2. **Onboarding** (`/onboarding`)
   - Primera vez: crear organización obligatoria
   - Ingresar nombre de Pyme y RUT
   - Usuario asignado como OWNER

3. **Dashboard** (`/dashboard`)
   - Acceso solo con sesión + organización
   - Sidebar con navegación
   - KPIs placeholder (para futuros módulos)

### Protección de Rutas

**proxy.ts** (Next.js 16+)
- Verifica autenticación en rutas `/dashboard/*`
- Redirige a `/login` si no autenticado
- Redirige a `/onboarding` si no tiene organización

### Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tendo_dev?schema=public"

# Auth.js
AUTH_SECRET="[generado con openssl rand -base64 32]"
NEXTAUTH_URL="http://localhost:3000"
```

### Comandos

```bash
# Desarrollo
npm run dev                      # Iniciar servidor (localhost:3000)

# Base de datos
npx prisma migrate dev           # Crear/aplicar migraciones
npx prisma generate              # Generar cliente Prisma
npx prisma studio                # Explorador visual de BD

# Build
npm run build                    # Compilar para producción
npm start                        # Ejecutar en producción
```

### Validaciones Implementadas

- **Email**: formato válido
- **Password**: mínimo 8 caracteres
- **RUT**: formato chileno XX.XXX.XXX-X con dígito verificador (módulo 11)
- **Nombre organización**: mínimo 2 caracteres

### Características Multi-tenant

✅ **Implementado:**
- Sesión incluye `organizationId`
- Rutas protegidas verifican organización
- Usuario puede tener múltiples membresías

🔜 **Pendiente (futuras fases):**
- Cambiar entre organizaciones
- Invitar usuarios a organizaciones existentes
- Gestión de roles y permisos

### Próximos Módulos Sugeridos

1. **Productos e Inventario**
   - Catálogo de productos
   - Control de stock
   - Categorías y variantes

2. **Punto de Venta (POS)**
   - Carrito de venta
   - Impresión de boletas
   - Cierre de caja

3. **Fiados (CRM Lite)**
   - Cuentas por cobrar
   - Historial de clientes
   - Recordatorios de pago

4. **Mi Caja (Finanzas)**
   - Gastos operacionales
   - Flujo de caja
   - Reportes financieros

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos
# Editar .env con tus credenciales de PostgreSQL

# 3. Ejecutar migraciones
npx prisma migrate dev

# 4. Iniciar servidor
npm run dev

# 5. Abrir navegador
http://localhost:3000
```

### Primer Usuario

1. Ir a `/register`
2. Crear cuenta con nombre, email y password
3. Automáticamente te redirige a `/onboarding`
4. Crear tu primera organización (nombre + RUT)
5. Acceder al dashboard

---

## 📝 Convenciones de Código

- **Archivos**: kebab-case (ej: `create-org-form.tsx`)
- **Componentes**: PascalCase (ej: `CreateOrgForm`)
- **Funciones/Variables**: camelCase (ej: `handleSubmit`)
- **Server Components por defecto**: usar `'use client'` solo cuando necesario
- **Route Handlers para APIs**: no Server Actions para CRUD complejas
- **Validación en todas las capas**: Zod en cliente y servidor

## 🔒 Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- Sesiones JWT con Auth.js
- Validación de entrada en cliente y servidor
- Protección de rutas con proxy.ts
- Queries incluyen `organizationId` (multi-tenancy)

## 📚 Recursos

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Prisma 7 Docs](https://www.prisma.io/docs)
- [Auth.js Docs](https://authjs.dev)
- [Shadcn/UI](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com)
