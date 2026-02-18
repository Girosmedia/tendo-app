import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ProfileForm } from './_components/profile-form';
import { ChangePasswordCard } from './_components/change-password-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function getRoleLabel(role: 'OWNER' | 'ADMIN' | 'MEMBER') {
  if (role === 'OWNER') return 'Propietario';
  if (role === 'ADMIN') return 'Administrador';
  return 'Miembro';
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      jobTitle: true,
      email: true,
      image: true,
      createdAt: true,
      memberships: {
        select: {
          id: true,
          role: true,
          isActive: true,
          organizationId: true,
          organization: {
            select: {
              name: true,
              rut: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tus datos personales y la seguridad de tu cuenta
        </p>
      </div>

      <ProfileForm
        initialData={{
          name: user.name || '',
          jobTitle: user.jobTitle || '',
          email: user.email,
          image: user.image || '',
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Relaciones de Usuario</CardTitle>
          <CardDescription>
            Vista referencial de organizaciones y roles asociados a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No existen membresías asociadas.</p>
          ) : (
            user.memberships.map((membership) => (
              <div key={membership.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{membership.organization.name}</p>
                    <p className="text-xs text-muted-foreground break-all">
                      RUT organización: {membership.organization.rut}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{getRoleLabel(membership.role)}</Badge>
                    <Badge variant={membership.isActive ? 'default' : 'outline'}>
                      {membership.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground">
            Tu email no se puede editar desde aquí. El RUT es único por organización y se administra en Configuración.
          </p>
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </div>
  );
}
