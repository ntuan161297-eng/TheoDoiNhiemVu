-- SQLite guards; these are integrity controls, not a replacement for Worker authorization.
CREATE TRIGGER membership_identity_immutable BEFORE UPDATE OF profile_id ON tenant_memberships
WHEN NEW.profile_id <> OLD.profile_id BEGIN SELECT RAISE(ABORT,'membership_profile_is_immutable'); END;
CREATE TRIGGER platform_admin_identity_immutable BEFORE UPDATE OF profile_id ON platform_admins
WHEN NEW.profile_id <> OLD.profile_id BEGIN SELECT RAISE(ABORT,'platform_admin_profile_is_immutable'); END;
CREATE TRIGGER task_original_due_immutable BEFORE UPDATE OF original_due_date ON tasks
WHEN NEW.original_due_date <> OLD.original_due_date BEGIN SELECT RAISE(ABORT,'original_due_date_is_immutable'); END;
CREATE TRIGGER task_completion_immutable BEFORE UPDATE ON tasks WHEN OLD.execution_status='DA_HOAN_THANH'
AND (NEW.execution_status IS NOT OLD.execution_status OR NEW.completed_date IS NOT OLD.completed_date
 OR NEW.completion_summary IS NOT OLD.completion_summary OR NEW.due_date_at_completion IS NOT OLD.due_date_at_completion
 OR NEW.confirmed_at IS NOT OLD.confirmed_at OR NEW.confirmed_by_membership_id IS NOT OLD.confirmed_by_membership_id)
BEGIN SELECT RAISE(ABORT,'completion_requires_explicit_correction_workflow'); END;
CREATE TRIGGER completed_task_no_delete BEFORE DELETE ON tasks WHEN OLD.execution_status='DA_HOAN_THANH'
BEGIN SELECT RAISE(ABORT,'completed_task_history_is_immutable'); END;
CREATE TRIGGER task_complete_insert BEFORE INSERT ON tasks WHEN NEW.execution_status='DA_HOAN_THANH' BEGIN
 SELECT RAISE(ABORT,'completion_date_is_in_future') WHERE NEW.completed_date > date('now','+7 hours');
 SELECT RAISE(ABORT,'completion_due_snapshot_mismatch') WHERE NEW.due_date_at_completion <> NEW.original_due_date;
END;
CREATE TRIGGER task_complete_update BEFORE UPDATE ON tasks WHEN NEW.execution_status='DA_HOAN_THANH' BEGIN
 SELECT RAISE(ABORT,'completion_date_is_in_future') WHERE NEW.completed_date > date('now','+7 hours');
 SELECT RAISE(ABORT,'completion_due_snapshot_mismatch') WHERE NEW.due_date_at_completion <>
   (SELECT effective_due_date FROM v_tasks_effective WHERE tenant_id=OLD.tenant_id AND id=OLD.id);
END;
CREATE TRIGGER coordinator_not_lead_insert BEFORE INSERT ON task_coordinating_units BEGIN
 SELECT RAISE(ABORT,'lead_unit_cannot_coordinate') WHERE NEW.unit_id=
   (SELECT lead_unit_id FROM tasks WHERE tenant_id=NEW.tenant_id AND id=NEW.task_id);
END;
CREATE TRIGGER coordinator_not_lead_update BEFORE UPDATE ON task_coordinating_units BEGIN
 SELECT RAISE(ABORT,'lead_unit_cannot_coordinate') WHERE NEW.unit_id=
   (SELECT lead_unit_id FROM tasks WHERE tenant_id=NEW.tenant_id AND id=NEW.task_id);
END;
CREATE TRIGGER task_lead_not_coordinator BEFORE UPDATE OF lead_unit_id ON tasks BEGIN
 SELECT RAISE(ABORT,'lead_unit_cannot_coordinate') WHERE EXISTS
   (SELECT 1 FROM task_coordinating_units WHERE tenant_id=NEW.tenant_id AND task_id=NEW.id AND unit_id=NEW.lead_unit_id);
END;
CREATE TRIGGER extension_insert_guard BEFORE INSERT ON extension_requests BEGIN
 SELECT RAISE(ABORT,'new_extension_must_be_pending') WHERE NEW.status <> 'PENDING';
 SELECT RAISE(ABORT,'completed_task_cannot_extend') WHERE EXISTS
   (SELECT 1 FROM tasks WHERE tenant_id=NEW.tenant_id AND id=NEW.task_id AND execution_status='DA_HOAN_THANH');
 SELECT RAISE(ABORT,'extension_sequence_mismatch') WHERE NEW.sequence <>
   (SELECT COALESCE(MAX(sequence),0)+1 FROM extension_requests WHERE tenant_id=NEW.tenant_id AND task_id=NEW.task_id);
 SELECT RAISE(ABORT,'extension_previous_due_mismatch') WHERE NEW.previous_due_date <>
   (SELECT effective_due_date FROM v_tasks_effective WHERE tenant_id=NEW.tenant_id AND id=NEW.task_id);
END;
CREATE TRIGGER extension_update_guard BEFORE UPDATE ON extension_requests BEGIN
 SELECT RAISE(ABORT,'extension_decision_is_immutable') WHERE OLD.status <> 'PENDING';
 SELECT RAISE(ABORT,'extension_origin_is_immutable') WHERE NEW.task_id <> OLD.task_id OR NEW.sequence <> OLD.sequence OR NEW.previous_due_date <> OLD.previous_due_date;
 SELECT RAISE(ABORT,'completed_task_cannot_extend') WHERE EXISTS
   (SELECT 1 FROM tasks WHERE tenant_id=OLD.tenant_id AND id=OLD.task_id AND execution_status='DA_HOAN_THANH');
END;
CREATE TRIGGER extension_no_delete BEFORE DELETE ON extension_requests
BEGIN SELECT RAISE(ABORT,'extension_history_is_immutable'); END;

CREATE TRIGGER tenants_id_immutable BEFORE UPDATE OF id ON tenants
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER profiles_id_immutable BEFORE UPDATE OF id ON profiles
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER organization_units_tenant_immutable BEFORE UPDATE OF tenant_id ON organization_units
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER organization_units_id_immutable BEFORE UPDATE OF id ON organization_units
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER tenant_memberships_tenant_immutable BEFORE UPDATE OF tenant_id ON tenant_memberships
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER tenant_memberships_id_immutable BEFORE UPDATE OF id ON tenant_memberships
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER tenant_member_roles_tenant_immutable BEFORE UPDATE OF tenant_id ON tenant_member_roles
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER user_unit_assignments_tenant_immutable BEFORE UPDATE OF tenant_id ON user_unit_assignments
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER task_sources_tenant_immutable BEFORE UPDATE OF tenant_id ON task_sources
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER task_sources_id_immutable BEFORE UPDATE OF id ON task_sources
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER leaders_tenant_immutable BEFORE UPDATE OF tenant_id ON leaders
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER leaders_id_immutable BEFORE UPDATE OF id ON leaders
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER source_documents_tenant_immutable BEFORE UPDATE OF tenant_id ON source_documents
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER source_documents_id_immutable BEFORE UPDATE OF id ON source_documents
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER tasks_tenant_immutable BEFORE UPDATE OF tenant_id ON tasks
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER tasks_id_immutable BEFORE UPDATE OF id ON tasks
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER task_coordinating_units_tenant_immutable BEFORE UPDATE OF tenant_id ON task_coordinating_units
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER task_progress_updates_tenant_immutable BEFORE UPDATE OF tenant_id ON task_progress_updates
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER task_progress_updates_id_immutable BEFORE UPDATE OF id ON task_progress_updates
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER expedite_documents_tenant_immutable BEFORE UPDATE OF tenant_id ON expedite_documents
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER expedite_documents_id_immutable BEFORE UPDATE OF id ON expedite_documents
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER expedite_document_tasks_tenant_immutable BEFORE UPDATE OF tenant_id ON expedite_document_tasks
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER extension_requests_tenant_immutable BEFORE UPDATE OF tenant_id ON extension_requests
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER extension_requests_id_immutable BEFORE UPDATE OF id ON extension_requests
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER import_jobs_tenant_immutable BEFORE UPDATE OF tenant_id ON import_jobs
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER import_jobs_id_immutable BEFORE UPDATE OF id ON import_jobs
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER import_job_rows_tenant_immutable BEFORE UPDATE OF tenant_id ON import_job_rows
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER import_job_rows_id_immutable BEFORE UPDATE OF id ON import_job_rows
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;

CREATE TRIGGER attachments_tenant_immutable BEFORE UPDATE OF tenant_id ON attachments
WHEN NEW.tenant_id <> OLD.tenant_id BEGIN SELECT RAISE(ABORT,'tenant_id_is_immutable'); END;

CREATE TRIGGER attachments_id_immutable BEFORE UPDATE OF id ON attachments
WHEN NEW.id <> OLD.id BEGIN SELECT RAISE(ABORT,'record_id_is_immutable'); END;
