-- INSERT OR REPLACE can perform implicit DELETE in SQLite. Reject reused
-- immutable IDs before that can bypass UPDATE/DELETE triggers.
-- Use explicit UPDATE for edits and versioned idempotency handling in the Worker.

CREATE TRIGGER tenants_no_replace BEFORE INSERT ON tenants
WHEN EXISTS (SELECT 1 FROM tenants WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER profiles_no_replace BEFORE INSERT ON profiles
WHEN EXISTS (SELECT 1 FROM profiles WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER organization_units_no_replace BEFORE INSERT ON organization_units
WHEN EXISTS (SELECT 1 FROM organization_units WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER tenant_memberships_no_replace BEFORE INSERT ON tenant_memberships
WHEN EXISTS (SELECT 1 FROM tenant_memberships WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER task_sources_no_replace BEFORE INSERT ON task_sources
WHEN EXISTS (SELECT 1 FROM task_sources WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER leaders_no_replace BEFORE INSERT ON leaders
WHEN EXISTS (SELECT 1 FROM leaders WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER audit_logs_no_replace BEFORE INSERT ON audit_logs
WHEN EXISTS (SELECT 1 FROM audit_logs WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER source_documents_no_replace BEFORE INSERT ON source_documents
WHEN EXISTS (SELECT 1 FROM source_documents WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER tasks_no_replace BEFORE INSERT ON tasks
WHEN EXISTS (SELECT 1 FROM tasks WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER task_progress_updates_no_replace BEFORE INSERT ON task_progress_updates
WHEN EXISTS (SELECT 1 FROM task_progress_updates WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER expedite_documents_no_replace BEFORE INSERT ON expedite_documents
WHEN EXISTS (SELECT 1 FROM expedite_documents WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER extension_requests_no_replace BEFORE INSERT ON extension_requests
WHEN EXISTS (SELECT 1 FROM extension_requests WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER import_jobs_no_replace BEFORE INSERT ON import_jobs
WHEN EXISTS (SELECT 1 FROM import_jobs WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER import_job_rows_no_replace BEFORE INSERT ON import_job_rows
WHEN EXISTS (SELECT 1 FROM import_job_rows WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;

CREATE TRIGGER attachments_no_replace BEFORE INSERT ON attachments
WHEN EXISTS (SELECT 1 FROM attachments WHERE id=NEW.id) BEGIN
 SELECT RAISE(ABORT,'record_identity_already_exists');
END;
