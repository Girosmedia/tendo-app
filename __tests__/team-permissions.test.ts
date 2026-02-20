import { describe, expect, it } from 'vitest';
import {
  canChangeMemberRole,
  canInviteMembers,
  canRemoveMember,
  canRevokeInvitations,
  canToggleMemberStatus,
} from '@/lib/utils/team-permissions';

describe('team permissions policy', () => {
  it('MEMBER no puede invitar ni revocar invitaciones', () => {
    expect(canInviteMembers('MEMBER')).toBe(false);
    expect(canRevokeInvitations('MEMBER')).toBe(false);
  });

  it('ADMIN puede invitar y revocar invitaciones', () => {
    expect(canInviteMembers('ADMIN')).toBe(true);
    expect(canRevokeInvitations('ADMIN')).toBe(true);
  });

  it('ADMIN no puede eliminar OWNER ni ADMIN', () => {
    expect(canRemoveMember({ actorRole: 'ADMIN', targetRole: 'OWNER', isSelf: false })).toBe(false);
    expect(canRemoveMember({ actorRole: 'ADMIN', targetRole: 'ADMIN', isSelf: false })).toBe(false);
    expect(canRemoveMember({ actorRole: 'ADMIN', targetRole: 'MEMBER', isSelf: false })).toBe(true);
  });

  it('OWNER puede eliminar ADMIN o MEMBER, pero no OWNER', () => {
    expect(canRemoveMember({ actorRole: 'OWNER', targetRole: 'ADMIN', isSelf: false })).toBe(true);
    expect(canRemoveMember({ actorRole: 'OWNER', targetRole: 'MEMBER', isSelf: false })).toBe(true);
    expect(canRemoveMember({ actorRole: 'OWNER', targetRole: 'OWNER', isSelf: false })).toBe(false);
  });

  it('solo OWNER puede cambiar roles (excepto a OWNER)', () => {
    expect(canChangeMemberRole({ actorRole: 'ADMIN', targetRole: 'MEMBER', isSelf: false })).toBe(false);
    expect(canChangeMemberRole({ actorRole: 'OWNER', targetRole: 'MEMBER', isSelf: false })).toBe(true);
    expect(canChangeMemberRole({ actorRole: 'OWNER', targetRole: 'OWNER', isSelf: false })).toBe(false);
  });

  it('ningún rol puede gestionarse a sí mismo', () => {
    expect(canToggleMemberStatus({ actorRole: 'OWNER', targetRole: 'MEMBER', isSelf: true })).toBe(false);
    expect(canRemoveMember({ actorRole: 'OWNER', targetRole: 'MEMBER', isSelf: true })).toBe(false);
    expect(canChangeMemberRole({ actorRole: 'OWNER', targetRole: 'MEMBER', isSelf: true })).toBe(false);
  });
});
