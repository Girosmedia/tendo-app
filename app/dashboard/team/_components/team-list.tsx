'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Crown, Shield, User, Trash2, Mail, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  canChangeMemberRole,
  canRemoveMember,
  canRevokeInvitations,
  canToggleMemberStatus,
  type TeamRole,
} from '@/lib/utils/team-permissions';

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  joinedAt: Date;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
}

interface TeamListProps {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: TeamRole | null;
}

export function TeamList({ members, invitations, currentUserId, currentUserRole }: TeamListProps) {
  const router = useRouter();
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [loadingInvitationId, setLoadingInvitationId] = useState<string | null>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-info" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      OWNER: 'default',
      ADMIN: 'secondary',
      MEMBER: 'outline',
    };
    return variants[role] || 'outline';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OWNER: 'Propietario',
      ADMIN: 'Administrador',
      MEMBER: 'Miembro',
    };
    return labels[role] || role;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setLoadingMemberId(memberId);

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('Rol actualizado exitosamente');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar rol');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar rol');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    setLoadingMemberId(memberId);

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(isActive ? 'Miembro desactivado' : 'Miembro activado');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;

    setLoadingMemberId(memberId);

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Miembro eliminado exitosamente');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar miembro');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar miembro');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('¿Estás seguro de revocar esta invitación?')) return;

    setLoadingInvitationId(invitationId);

    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Invitación revocada exitosamente');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al revocar invitación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al revocar invitación');
    } finally {
      setLoadingInvitationId(null);
    }
  };

  const canManageMember = (member: Member) => {
    const isSelf = member.userId === currentUserId;
    const targetRole = member.role as TeamRole;

    return {
      canChangeRole: canChangeMemberRole({
        actorRole: currentUserRole,
        targetRole,
        isSelf,
      }),
      canToggleStatus: canToggleMemberStatus({
        actorRole: currentUserRole,
        targetRole,
        isSelf,
      }),
      canRemove: canRemoveMember({
        actorRole: currentUserRole,
        targetRole,
        isSelf,
      }),
    };
  };

  const canManageInvitations = canRevokeInvitations(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Miembros Activos */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'} en tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4 p-4">
            {members.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Avatar + Nombre + Rol Icon */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={member.image || undefined} alt={member.name || ''} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{member.name || 'Sin nombre'}</h3>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {getRoleIcon(member.role)}
                    </div>

                    {/* Grid: Rol + Estado */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Rol</p>
                        <Badge variant={getRoleBadge(member.role)} className="mt-1">
                          {getRoleLabel(member.role)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Estado</p>
                        <Badge variant={member.isActive ? 'default' : 'secondary'} className="mt-1">
                          {member.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>

                    {/* Fecha Ingreso */}
                    <p className="text-xs text-muted-foreground">
                      Ingresó {format(new Date(member.joinedAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>

                    {/* Acciones */}
                    {(() => {
                      const permissions = canManageMember(member);
                      const hasAnyAction = permissions.canChangeRole || permissions.canToggleStatus || permissions.canRemove;

                      if (!hasAnyAction) {
                        return null;
                      }

                      return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-11"
                            disabled={loadingMemberId === member.id}
                          >
                            Opciones
                            <MoreHorizontal className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56">
                          {permissions.canChangeRole && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'ADMIN')}
                              >
                                Hacer Administrador
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'MEMBER')}
                              >
                                Hacer Miembro
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {permissions.canToggleStatus && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(member.id, member.isActive)}
                              >
                                {member.isActive ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {permissions.canRemove && (
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <ResponsiveTable>
              <div style={{ minWidth: '800px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Ingreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.image || undefined} alt={member.name || ''} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name || 'Sin nombre'}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <Badge variant={getRoleBadge(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                      {member.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(member.joinedAt), "d 'de' MMMM, yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const permissions = canManageMember(member);
                      const hasAnyAction = permissions.canChangeRole || permissions.canToggleStatus || permissions.canRemove;

                      if (!hasAnyAction) {
                        return null;
                      }

                      return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={loadingMemberId === member.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {permissions.canChangeRole && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'ADMIN')}
                              >
                                Hacer Administrador
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'MEMBER')}
                              >
                                Hacer Miembro
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {permissions.canToggleStatus && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(member.id, member.isActive)}
                              >
                                {member.isActive ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {permissions.canRemove && (
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </ResponsiveTable>
          </div>
        </CardContent>
      </Card>

      {/* Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitaciones Pendientes
            </CardTitle>
            <CardDescription>
              {invitations.length} {invitations.length === 1 ? 'invitación' : 'invitaciones'} esperando respuesta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4 p-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Email Principal */}
                      <div>
                        <h3 className="font-semibold text-lg truncate">{invitation.email}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviada {format(new Date(invitation.createdAt), "d 'de' MMMM", { locale: es })}
                        </p>
                      </div>

                      {/* Grid: Rol + Expiración */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground text-xs">Rol</p>
                          <Badge variant={getRoleBadge(invitation.role)} className="mt-1">
                            {getRoleLabel(invitation.role)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Expira</p>
                          <p className="font-medium text-sm mt-1">
                            {format(new Date(invitation.expiresAt), "d 'de' MMM", { locale: es })}
                          </p>
                        </div>
                      </div>

                      {/* Botón Revocar */}
                      {canManageInvitations && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-11"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          disabled={loadingInvitationId === invitation.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Revocar Invitación
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <ResponsiveTable>
                <div style={{ minWidth: '700px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadge(invitation.role)}>
                        {getRoleLabel(invitation.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expiresAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageInvitations && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          disabled={loadingInvitationId === invitation.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Revocar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </ResponsiveTable>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
