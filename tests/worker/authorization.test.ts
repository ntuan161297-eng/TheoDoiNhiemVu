import { describe, expect, it, vi } from 'vitest';
import { permissionsForRoles } from '../../server/auth/permissions';
import { authorizeTenantRequest, requireTenantPermission, type TenantContext } from '../../server/auth/authorization';

describe('B1 permissions are separate from DEMO and platform roles', () => {
  it('does not grant tenant business data to a platform role or an unknown role', () => {
    expect(permissionsForRoles(['SUPER_ADMIN', 'ADMIN', 'constructor']).size).toBe(0);
  });
  it('keeps Tenant Admin administration separate from business roles', () => {
    const permissions = permissionsForRoles(['TENANT_ADMIN']);
    expect(permissions.has('roles:manage')).toBe(true);
    expect(permissions.has('tasks:read')).toBe(false);
    expect(permissions.has('tasks:confirm')).toBe(false);
  });
  it('gives editors writes and confirmers confirmation without implicit inheritance', () => {
    expect(permissionsForRoles(['OFFICE_EDITOR']).has('tasks:write')).toBe(true);
    expect(permissionsForRoles(['OFFICE_EDITOR']).has('tasks:confirm')).toBe(false);
    expect(permissionsForRoles(['OFFICE_CONFIRMER']).has('tasks:confirm')).toBe(true);
    expect(permissionsForRoles(['OFFICE_CONFIRMER']).has('tasks:write')).toBe(false);
  });
  it('allows explicit multiple roles but keeps viewers read-only', () => {
    expect(permissionsForRoles(['OFFICE_EDITOR', 'OFFICE_CONFIRMER']).has('tasks:confirm')).toBe(true);
    expect([...permissionsForRoles(['LEADER_VIEWER'])].every(p => p.endsWith(':read'))).toBe(true);
  });
  it('fails closed before querying data if there is no real identity verifier', async () => {
    const prepare = vi.fn();
    await expect(authorizeTenantRequest(new Request('https://local.invalid/api/tasks'), { prepare } as unknown as D1Database, undefined, 'A', 'tasks:read'))
      .rejects.toMatchObject({ status: 503, code: 'AUTH_NOT_CONFIGURED' });
    expect(prepare).not.toHaveBeenCalled();
  });
  it('does not accept a caller-forged tenant context', () => {
    expect(() => requireTenantPermission({ tenantId: 'A', permissions: new Set(['tasks:read']) } as unknown as TenantContext, 'tasks:read'))
      .toThrow('PERMISSION_DENIED');
  });
});
