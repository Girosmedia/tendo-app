import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Verificar autenticación y permisos de super admin
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    // Obtener todos los logs de auditoría
    const logs = await db.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limitar a los últimos 100 registros
    });

    // Obtener información de los usuarios involucrados
    const userIds = [...new Set(logs.map(log => log.userId))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    // Enriquecer logs con información de usuario
    const enrichedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      user: usersMap.get(log.userId) || null,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      changes: log.changes,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      total: enrichedLogs.length,
    });
  } catch (error) {
    console.error('Error al obtener audit logs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
