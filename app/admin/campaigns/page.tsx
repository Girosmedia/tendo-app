import { AdminCampaignForm } from '../_components/admin-campaign-form';

export default function AdminCampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Campañas</h2>
        <p className="text-muted-foreground">
          Envía correos personalizados a perfiles Owner y Admin desde el panel superadmin.
        </p>
      </div>

      <AdminCampaignForm />
    </div>
  );
}
