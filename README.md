# Tendo - Sistema de Gestión para Pymes Chilenas 🇨🇱

> Plataforma integral de gestión empresarial diseñada específicamente para pequeñas y medianas empresas en Chile.

## 🌟 ¿Qué es Tendo?

Tendo es un sistema de gestión empresarial moderno, intuitivo y adaptado a la realidad chilena. Combina funcionalidades de:

- 💰 **Track Retail**: Punto de Venta + Inventario
- 🛠️ **Track Servicios**: Cotizaciones + Gestión de Proyectos
- 💵 **Mi Caja**: Control de gastos y flujo de caja
- 📊 **Fiados**: Gestión de cuentas por cobrar

## 🚀 Estado del Proyecto

### ✅ Fase 1: Núcleo Multi-tenant y Autenticación (Completada)

- Sistema de usuarios con Auth.js v5
- Arquitectura multi-tenant (múltiples organizaciones)
- Onboarding con validación de RUT chileno
- Dashboard base con navegación

📖 **[Ver documentación completa de Fase 1](./FASE_1_README.md)**

### 🔄 Próximas Fases

- **Fase 2**: Módulo de Productos e Inventario
- **Fase 3**: Punto de Venta (POS)
- **Fase 4**: Módulos Financieros (Mi Caja, Fiados)

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router + React 19)
- **Base de Datos**: PostgreSQL + Prisma ORM 7
- **Autenticación**: Auth.js v5
- **UI**: Shadcn/UI + Tailwind CSS v4
- **TypeScript**: Strict mode habilitado

## ⚡ Inicio Rápido

```bash
# Clonar repositorio
git clone [url-del-repo]
cd tendo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones de base de datos
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📋 Requisitos Previos

- Node.js 20.19.0+ (o 22.x)
- PostgreSQL 13+
- npm o pnpm

## 🗂️ Estructura del Proyecto

```
tendo/
├── app/                    # Rutas y páginas (Next.js App Router)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Panel protegido
│   └── api/               # API Routes (patrón BFF)
├── components/            # Componentes React
│   └── ui/               # Componentes Shadcn
├── lib/                   # Utilidades y configuración
│   ├── db.ts             # Cliente Prisma
│   ├── validators/       # Schemas Zod
│   └── utils/            # Helpers (RUT, slugify, etc.)
├── prisma/
│   └── schema.prisma     # Modelo de datos
├── proxy.ts              # Middleware (Next.js 16+)
└── auth.ts               # Configuración Auth.js
```

## 🇨🇱 Características Locales

- ✅ Validación de RUT chileno (algoritmo módulo 11)
- ✅ Formato de moneda CLP
- ✅ Zona horaria America/Santiago
- ✅ Idioma español (formal pero cercano)
- ✅ Terminología local (no anglicismos)

## 🤝 Contribución

Este proyecto sigue una arquitectura modular. Cada módulo de negocio está aislado en `app/features/[modulo]/`.

### Convenciones de Código

- **Server Components por defecto** (Next.js 15+)
- **Route Handlers** para APIs complejas (no Server Actions)
- **Validación Zod** en todas las entradas de usuario
- **TypeScript estricto**: sin `any`, usar `interface` para objetos

## 📄 Licencia

[Definir licencia]

## 📞 Soporte

[Definir canales de soporte]

---

Built with ❤️ for Chilean SMEs
