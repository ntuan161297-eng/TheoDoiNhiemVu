import { permissionsForRoles, type PlatformPermission, type TenantPermission } from './permissions';

// B2 must implement signature/issuer/audience/expiry validation. No implementation
// accepts a DEMO role, request body, or merely decoded token as proof of identity.
export interface VerifiedIdentity { issuer: string; subject: string }
export type IdentityVerifier = (request: Request) => Promise<VerifiedIdentity | null>;
export class AccessError extends Error {
  constructor(public readonly status: 401 | 403 | 503, public readonly code: string) {
    super(code);
    this.name = 'AccessError';
  }
}

const tenantContextBrand = Symbol('server-tenant-context');
const platformContextBrand = Symbol('server-platform-context');
export interface TenantContext {
  readonly [tenantContextBrand]: true;
  readonly tenantId: string;
  readonly membershipId: string;
  readonly profileId: string;
  readonly permissions: ReadonlySet<TenantPermission>;
}
export interface PlatformContext {
  readonly [platformContextBrand]: true;
  readonly profileId: string;
}

async function verifiedIdentity(request: Request, verifier?: IdentityVerifier): Promise<VerifiedIdentity> {
  if (!verifier) throw new AccessError(503, 'AUTH_NOT_CONFIGURED');
  let identity: VerifiedIdentity | null;
  try { identity = await verifier(request); } catch { throw new AccessError(401, 'INVALID_IDENTITY'); }
  if (!identity || typeof identity.issuer !== 'string' || !identity.issuer.trim()
    || typeof identity.subject !== 'string' || !identity.subject.trim()) throw new AccessError(401, 'INVALID_IDENTITY');
  return identity;
}

// Internal only. Worker exposes no authenticated/business route in B1.
// Create a fresh context per request; never cache it across role/membership changes.
export async function authorizeTenantRequest(
  request: Request, db: D1Database, verifier: IdentityVerifier | undefined,
  tenantId: string, permission: TenantPermission,
): Promise<TenantContext> {
  const identity = await verifiedIdentity(request, verifier);
  const row = await db.prepare(`SELECT p.id AS profile_id,p.status AS profile_status,
    m.id AS membership_id,m.status AS membership_status,t.status AS tenant_status,
    COALESCE((SELECT json_group_array(r.role) FROM tenant_member_roles r
      WHERE r.tenant_id=m.tenant_id AND r.membership_id=m.id),'[]') AS roles_json
    FROM profiles p JOIN tenant_memberships m ON m.profile_id=p.id JOIN tenants t ON t.id=m.tenant_id
    WHERE p.identity_issuer=? AND p.identity_subject=? AND m.tenant_id=?`)
    .bind(identity.issuer, identity.subject, tenantId).first<{
      profile_id: string; profile_status: string; membership_id: string;
      membership_status: string; tenant_status: string; roles_json: string;
    }>();
  if (!row || row.profile_status !== 'ACTIVE' || row.membership_status !== 'ACTIVE' || row.tenant_status !== 'ACTIVE') {
    throw new AccessError(403, 'TENANT_ACCESS_DENIED');
  }
  const permissions = permissionsForRoles(JSON.parse(row.roles_json) as string[]);
  if (!permissions.has(permission)) throw new AccessError(403, 'PERMISSION_DENIED');
  return { [tenantContextBrand]: true, tenantId, membershipId: row.membership_id, profileId: row.profile_id, permissions };
}

export async function authorizePlatformRequest(
  request: Request, db: D1Database, verifier: IdentityVerifier | undefined, permission: PlatformPermission,
): Promise<PlatformContext> {
  const identity = await verifiedIdentity(request, verifier);
  if (!['tenants:manage', 'tenant-admins:assign', 'platform-audit:read'].includes(permission)) {
    throw new AccessError(403, 'PLATFORM_ACCESS_DENIED');
  }
  const row = await db.prepare(`SELECT p.id FROM profiles p JOIN platform_admins a ON a.profile_id=p.id
    WHERE p.identity_issuer=? AND p.identity_subject=? AND p.status='ACTIVE' AND a.status='ACTIVE'`)
    .bind(identity.issuer, identity.subject).first<{ id: string }>();
  if (!row) throw new AccessError(403, 'PLATFORM_ACCESS_DENIED');
  return { [platformContextBrand]: true, profileId: row.id };
}

export function requireTenantPermission(context: TenantContext, permission: TenantPermission): void {
  if (!context || context[tenantContextBrand] !== true || !context.permissions.has(permission)) {
    throw new AccessError(403, 'PERMISSION_DENIED');
  }
}
