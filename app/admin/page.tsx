import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminMetricsDashboard } from '@/app/admin/_components/admin-metrics-dashboard';

export default async function AdminPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resumen Global</h2>
        <p className="text-muted-foreground">
          Métricas SaaS y vista general del sistema Tendo
        </p>
      </div>

      <AdminMetricsDashboard />

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
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
