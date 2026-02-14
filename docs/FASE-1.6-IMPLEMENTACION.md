# Fase 1.6: Asignación de Propietarios y Gestión de Membresías

## Resumen

Fase completada para resolver el problema crítico de tenants creados manualmente sin usuarios asociados. Se implementó el patrón **Organization-First** (usado por Slack, Notion, GitHub) donde cada organización debe tener al menos un propietario desde su creación.

## Problema Identificado

Al crear tenants manualmente desde el panel admin, no existía forma de:
1. Asociar un usuario propietario al momento de la creación
2. Los tenants quedaban "huérfanos" sin acceso
3. No había interfaz para agregar usuarios existentes a organizaciones

## Solución Implementada

### 1. Creación de Tenant con Propietario

**Componente:** `app/admin/tenants/_components/create-tenant-sheet.tsx`

- Agregados campos `ownerEmail` (requerido) y `ownerName` (opcional)
- Validación: Email debe tener formato válido
- Descripción clara: "Si el email ya existe, se asociará al tenant. Si no existe, se creará un usuario nuevo"

**Schema Zod Actualizado:**
```typescript
const createTenantSchema = z.object({
  name: z.string().min(3),
  rut: z.string().min(8),
  ownerEmail: z.string().email(), // NUEVO
  ownerName: z.string().optional(), // NUEVO
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED']),
  modules: z.array(z.string()),
})
```

### 2. Backend con Transacción Atómica

**Endpoint:** `app/api/admin/tenants/route.ts` (POST)

Lógica implementada:
1. Busca usuario por email
2. Si no existe, lo crea con contraseña temporal (bcrypt)
3. Crea organización
4. Crea membresía con rol `OWNER`
5. Establece `currentOrganizationId` en el usuario
6. Registra en audit log con detalles del propietario

**Código clave:**
```typescript
const result = await db.$transaction(async (tx) => {
  // Buscar o crear propietario
  let owner = await tx.user.findUnique({ where: { email: ownerEmail } })
  
  if (!owner) {
    const temporaryPassword = Math.random().toString(36).slice(-10)
    owner = await tx.user.create({
      data: {
        email: ownerEmail,
        name: ownerName || ownerEmail.split('@')[0],
        password: await bcrypt.hash(temporaryPassword, 10),
      },
    })
    console.log('[TEMP PASSWORD]', ownerEmail, temporaryPassword)
  }

  // Crear organización
  const organization = await tx.organization.create({ ... })

  // Crear membresía OWNER
  await tx.member.create({
    data: {
      userId: owner.id,
      organizationId: organization.id,
      role: 'OWNER',
    },
  })

  // Establecer como organización actual si no tiene otra
  if (!owner.currentOrganizationId) {
    await tx.user.update({
      where: { id: owner.id },
      data: { currentOrganizationId: organization.id },
    })
  }

  return { organization, owner }
})
```

### 3. API de Gestión de Membresías

**Endpoints creados:**

#### POST `/api/admin/memberships`
Agrega usuario a organización con validaciones:
- ✅ Valida userId, organizationId, role
- ✅ Verifica constraint único (userId + organizationId)
- ✅ Establece currentOrganizationId si el usuario no tiene ninguna
- ✅ Registra en audit log con acción `ADD_USER_TO_ORGANIZATION`

#### PATCH `/api/admin/memberships/[id]`
Actualiza rol de una membresía:
- ✅ Cambia MEMBER → ADMIN → OWNER
- ✅ Registra cambios en audit log

#### DELETE `/api/admin/memberships/[id]`
Elimina membresía con protecciones:
- ✅ **Valida último propietario**: No permite eliminar si es el único OWNER
- ✅ Resetea currentOrganizationId si era la organización activa
- ✅ Registra eliminación en audit log

**Código de protección:**
```typescript
// Verificar que no sea el último OWNER
const membership = await db.member.findUnique({
  where: { id },
  include: { organization: true },
})

if (membership.role === 'OWNER') {
  const ownerCount = await db.member.count({
    where: {
      organizationId: membership.organizationId,
      role: 'OWNER',
    },
  })

  if (ownerCount <= 1) {
    return NextResponse.json(
      { error: 'No se puede eliminar el último propietario de la organización' },
      { status: 400 }
    )
  }
}
```

### 4. Interfaz de Gestión de Membresías

**Componente:** `app/admin/users/_components/membership-manager.tsx`

Funcionalidades:
- 📋 Lista organizaciones actuales del usuario con badges de rol
- ➕ Botón "Agregar" que abre diálogo
- 🗑️ Botón eliminar por cada organización
- 🔍 Select con organizaciones disponibles (excluye las que ya tiene)
- 🎭 Select de roles: MEMBER, ADMIN, OWNER

**Integrado en:** `app/admin/users/_components/edit-user-sheet.tsx`

Ahora el sheet incluye:
1. Gestión de membresías (nuevo componente)
2. Datos básicos (nombre, email)
3. Rol de super admin

### 5. Endpoint GET Detallado

**Agregado:** `GET /api/admin/users/[id]`

Retorna usuario con membresías completas:
```typescript
{
  user: {
    id, name, email, isSuperAdmin,
    currentOrganizationId,
    memberships: [
      {
        id,              // ID de la membresía (para DELETE)
        role,
        organizationId,
        organization: { id, name, slug }
      }
    ]
  }
}
```

## Flujos de Usuario

### Flujo 1: Crear Tenant con Usuario Nuevo
1. Admin abre "Crear Organización"
2. Ingresa datos de organización
3. Ingresa email + nombre del propietario (email no existe)
4. Submit → Usuario creado + Tenant creado + Membresía OWNER
5. 🔐 Contraseña temporal loggeada en consola (TODO: enviar email)

### Flujo 2: Crear Tenant con Usuario Existente
1. Admin abre "Crear Organización"
2. Ingresa email de usuario que ya existe
3. Submit → Usuario asociado + Tenant creado + Membresía OWNER
4. ✅ No duplica usuario, solo asocia

### Flujo 3: Agregar Usuario a Organización Existente
1. Admin edita usuario en tabla
2. En sheet, sección "Organizaciones" → clic "Agregar"
3. Selecciona organización del dropdown
4. Selecciona rol (MEMBER/ADMIN/OWNER)
5. Submit → Membresía creada

### Flujo 4: Remover Usuario de Organización
1. Admin edita usuario
2. En lista de organizaciones, clic en ícono 🗑️
3. Confirma eliminación
4. Si es último OWNER → ❌ Error: "No se puede eliminar el último propietario"
5. Si pasa validación → Membresía eliminada

## Validaciones de Negocio

✅ **Un tenant SIEMPRE tiene propietario** (desde creación)  
✅ **No se puede eliminar el último OWNER** (evita organizaciones huérfanas)  
✅ **No duplica usuarios** (busca por email antes de crear)  
✅ **Mantiene currentOrganizationId actualizado** (se resetea al eliminar org activa)  
✅ **Audit trail completo** (todos los cambios registrados)  
✅ **Transacciones atómicas** (rollback si falla algún paso)  

## Audit Log Actions Agregadas

```typescript
ADD_USER_TO_ORGANIZATION: 'add_user_to_organization',
REMOVE_USER_FROM_ORGANIZATION: 'remove_user_from_organization',
UPDATE_MEMBERSHIP_ROLE: 'update_membership_role',
```

## Seguridad

- Todas las operaciones requieren `isSuperAdmin = true`
- Verificación de sesión en cada endpoint
- Validación Zod en todos los inputs
- Prevent SQL injection (Prisma ORM)
- Bcrypt para contraseñas temporales (10 rounds)

## Mejoras Futuras (TODOs)

### Alta Prioridad
- [ ] Sistema de notificaciones por email
  - Enviar contraseña temporal a usuarios nuevos
  - Link de cambio de contraseña obligatorio
  - Welcome email con info del tenant

### Media Prioridad
- [ ] Cambiar organización actual desde UI
  - Actualmente solo se actualiza automáticamente
  - Agregar botón "Establecer como activa" en MembershipManager

- [ ] Bulk operations
  - Invitar múltiples usuarios a la vez
  - Importar CSV de usuarios

### Baja Prioridad
- [ ] Dashboard metrics
  - Usuarios sin organizaciones
  - Organizaciones sin propietarios (debería ser 0)
  - Promedio de usuarios por organización

## Testing Manual Recomendado

1. **Crear tenant con email nuevo**
   - ✅ Usuario creado
   - ✅ Membresía OWNER creada
   - ✅ currentOrganizationId establecido
   - ✅ Audit log registrado

2. **Crear tenant con email existente**
   - ✅ Usuario NO duplicado
   - ✅ Nueva membresía creada
   - ✅ Usuario puede acceder al nuevo tenant

3. **Agregar usuario a organización**
   - ✅ Membresía creada con rol correcto
   - ✅ Aparece en lista de organizaciones del usuario
   - ✅ No permite duplicados

4. **Intentar eliminar último OWNER**
   - ✅ Error mostrado
   - ✅ Membresía NO eliminada
   - ✅ Mensaje claro al usuario

5. **Eliminar membresía válida**
   - ✅ Membresía eliminada
   - ✅ currentOrganizationId reseteado si corresponde
   - ✅ Usuario ya no ve la organización

## Comandos de Verificación

```bash
# Ver contraseñas temporales en logs (desarrollo)
npm run dev | grep "TEMP PASSWORD"

# Verificar membresías duplicadas (no debería retornar nada)
npx prisma studio
# SELECT userId, organizationId, COUNT(*) FROM Member GROUP BY userId, organizationId HAVING COUNT(*) > 1

# Verificar organizaciones sin owners
# SELECT o.* FROM Organization o 
# LEFT JOIN Member m ON o.id = m.organizationId AND m.role = 'OWNER' 
# WHERE m.id IS NULL
```

## Archivos Modificados/Creados

### Creados
- `app/admin/users/_components/membership-manager.tsx`
- `app/api/admin/memberships/route.ts`
- `app/api/admin/memberships/[id]/route.ts`
- `docs/FASE-1.6-IMPLEMENTACION.md` (este archivo)

### Modificados
- `app/admin/tenants/_components/create-tenant-sheet.tsx` (agregados campos owner)
- `app/api/admin/tenants/route.ts` (POST con transacción)
- `app/admin/users/_components/edit-user-sheet.tsx` (integrado MembershipManager)
- `app/api/admin/users/[id]/route.ts` (agregado GET endpoint)
- `lib/audit.ts` (agregadas acciones de membresías)

## Conclusión

✅ **Fase 1.6 Completada**

Se resolvió el problema crítico de tenants huérfanos mediante:
- Asignación obligatoria de propietarios en creación
- API completa de gestión de membresías
- Interfaz intuitiva para agregar/remover usuarios
- Validaciones robustas de lógica de negocio
- Audit trail completo de todos los cambios

El sistema ahora sigue el patrón Organization-First estándar de SaaS, garantizando que cada organización siempre tenga al menos un propietario con acceso administrativo completo.
