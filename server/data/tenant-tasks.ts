import { requireTenantPermission, type TenantContext } from '../auth/authorization';

// Internal pattern for B2/D. There is deliberately no HTTP endpoint for this read.
export async function getTenantTask(db: D1Database, context: TenantContext, taskId: string) {
  requireTenantPermission(context, 'tasks:read');
  return db.prepare(`SELECT t.id,t.tenant_id,t.code,t.title,t.execution_status,t.effective_due_date
    FROM v_tasks_effective t WHERE t.tenant_id=? AND t.id=? AND EXISTS (
      SELECT 1 FROM tenant_memberships m JOIN profiles p ON p.id=m.profile_id
      JOIN tenants agency ON agency.id=m.tenant_id
      JOIN tenant_member_roles r ON r.tenant_id=m.tenant_id AND r.membership_id=m.id
      WHERE m.tenant_id=t.tenant_id AND m.id=? AND m.profile_id=?
      AND m.status='ACTIVE' AND p.status='ACTIVE' AND agency.status='ACTIVE'
      AND r.role IN ('OFFICE_EDITOR','OFFICE_CONFIRMER','LEADER_VIEWER'))`)
    .bind(context.tenantId, taskId, context.membershipId, context.profileId)
    .first<{ id: string; tenant_id: string; code: string; title: string; execution_status: string; effective_due_date: string }>();
}
