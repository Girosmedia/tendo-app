export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export function canInviteMembers(actorRole: TeamRole | null | undefined): boolean {
  return actorRole === 'OWNER' || actorRole === 'ADMIN';
}

export function canRevokeInvitations(actorRole: TeamRole | null | undefined): boolean {
  return actorRole === 'OWNER' || actorRole === 'ADMIN';
}

export function canChangeMemberRole(params: {
  actorRole: TeamRole | null | undefined;
  targetRole: TeamRole;
  isSelf: boolean;
}): boolean {
  const { actorRole, targetRole, isSelf } = params;

  if (!actorRole || isSelf) {
    return false;
  }

  if (actorRole !== 'OWNER') {
    return false;
  }

  return targetRole !== 'OWNER';
}

export function canToggleMemberStatus(params: {
  actorRole: TeamRole | null | undefined;
  targetRole: TeamRole;
  isSelf: boolean;
}): boolean {
  const { actorRole, targetRole, isSelf } = params;

  if (!actorRole || isSelf) {
    return false;
  }

  if (actorRole === 'OWNER') {
    return targetRole === 'ADMIN' || targetRole === 'MEMBER';
  }

  if (actorRole === 'ADMIN') {
    return targetRole === 'MEMBER';
  }

  return false;
}

export function canRemoveMember(params: {
  actorRole: TeamRole | null | undefined;
  targetRole: TeamRole;
  isSelf: boolean;
}): boolean {
  const { actorRole, targetRole, isSelf } = params;

  if (!actorRole || isSelf) {
    return false;
  }

  if (actorRole === 'OWNER') {
    return targetRole === 'ADMIN' || targetRole === 'MEMBER';
  }

  if (actorRole === 'ADMIN') {
    return targetRole === 'MEMBER';
  }

  return false;
}
