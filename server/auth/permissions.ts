export const tenantRolePermissions = {
  TENANT_ADMIN: ['units:manage', 'members:manage', 'roles:manage', 'catalogs:read', 'catalogs:manage', 'audit:read'],
  OFFICE_EDITOR: ['tasks:read', 'tasks:write', 'progress:write', 'expedites:write', 'extensions:request', 'reports:read', 'documents:read', 'catalogs:read'],
  OFFICE_CONFIRMER: ['tasks:read', 'tasks:confirm', 'extensions:decide', 'reports:read', 'documents:read', 'catalogs:read'],
  LEADER_VIEWER: ['tasks:read', 'reports:read', 'documents:read', 'catalogs:read'],
} as const;
export type TenantRole = keyof typeof tenantRolePermissions;
export type TenantPermission = typeof tenantRolePermissions[TenantRole][number];
export type PlatformPermission = 'tenants:manage' | 'tenant-admins:assign' | 'platform-audit:read';

export function permissionsForRoles(roles: readonly string[]): ReadonlySet<TenantPermission> {
  const permissions = new Set<TenantPermission>();
  for (const role of roles) {
    if (Object.hasOwn(tenantRolePermissions, role)) {
      for (const permission of tenantRolePermissions[role as TenantRole]) permissions.add(permission);
    }
  }
  return permissions;
}
