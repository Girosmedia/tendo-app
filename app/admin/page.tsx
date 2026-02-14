import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield } from 'lucide-react';

export default async function AdminPage() {
  const session = await auth();

  // Obtener métricas globales
  const [totalOrganizations, totalUsers, activeOrganizations] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.organization.count({
      where: { status: 'ACTIVE' },
    }),
  ]);

  const stats = [
    {
      title: 'Total Tenants',
      value: totalOrganizations,
      description: `${activeOrganizations} activos`,
      icon: Building2,
      color: 'text-indigo-600',
    },
    {
      title: 'Total Usuarios',
      value: totalUsers,
      description: 'Usuarios registrados',
      icon: Users,
      color: 'text-emerald-600',
    },
    {
      title: 'Sesión Activa',
      value: session?.user.name || 'Admin',
      description: session?.user.email || '',
      icon: Shield,
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resumen Global</h2>
        <p className="text-muted-foreground">
          Vista general del sistema Tendo
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestiona tenants y usuarios desde el menú lateral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Gestión de Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ver, editar y administrar organizaciones registradas en el sistema
                </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administrar usuarios, permisos y accesos globales
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
