-- Structural foundation for Stage D; no business endpoints or task data are enabled.
CREATE TABLE source_documents (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  document_kind TEXT NOT NULL CHECK(document_kind IN ('DOCUMENT','MEETING','OTHER')),
  reference_no TEXT,
  issued_date TEXT CHECK(issued_date IS NULL OR (length(issued_date)=10 AND date(issued_date,'+0 days') IS NOT NULL AND date(issued_date,'+0 days')=issued_date)),
  issuer TEXT,
  summary TEXT NOT NULL CHECK(length(trim(summary)) > 0),
  created_by_membership_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  UNIQUE(tenant_id,id),
  FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_source_document_reference ON source_documents(tenant_id,reference_no,issued_date);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(code)) > 0),
  external_ref TEXT CHECK(external_ref IS NULL OR length(trim(external_ref)) > 0),
  source_id TEXT NOT NULL,
  source_document_id TEXT,
  lead_unit_id TEXT NOT NULL,
  leader_id TEXT NOT NULL,
  office_owner_membership_id TEXT,
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),
  body TEXT,
  field TEXT,
  note TEXT,
  assigned_date TEXT NOT NULL CHECK(length(assigned_date)=10 AND date(assigned_date,'+0 days') IS NOT NULL AND date(assigned_date,'+0 days')=assigned_date),
  start_date TEXT CHECK(start_date IS NULL OR (length(start_date)=10 AND date(start_date,'+0 days') IS NOT NULL AND date(start_date,'+0 days')=start_date)),
  original_due_date TEXT NOT NULL CHECK(length(original_due_date)=10 AND date(original_due_date,'+0 days') IS NOT NULL AND date(original_due_date,'+0 days')=original_due_date AND original_due_date >= assigned_date),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('NORMAL','HIGH','URGENT')),
  execution_status TEXT NOT NULL DEFAULT 'CHUA_THUC_HIEN' CHECK(execution_status IN ('CHUA_THUC_HIEN','DANG_THUC_HIEN','DA_HOAN_THANH')),
  progress_percent INTEGER CHECK(progress_percent BETWEEN 0 AND 100),
  completed_date TEXT CHECK(completed_date IS NULL OR (length(completed_date)=10 AND date(completed_date,'+0 days') IS NOT NULL AND date(completed_date,'+0 days')=completed_date AND completed_date >= assigned_date)),
  completion_summary TEXT,
  due_date_at_completion TEXT CHECK(due_date_at_completion IS NULL OR (length(due_date_at_completion)=10 AND date(due_date_at_completion,'+0 days') IS NOT NULL AND date(due_date_at_completion,'+0 days')=due_date_at_completion)),
  confirmed_at TEXT,
  confirmed_by_membership_id TEXT,
  created_by_membership_id TEXT NOT NULL,
  updated_by_membership_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,code),
  CHECK((execution_status = 'DA_HOAN_THANH' AND completed_date IS NOT NULL AND length(trim(completion_summary)) > 0 AND completion_summary IS NOT NULL AND due_date_at_completion IS NOT NULL AND length(trim(confirmed_at)) > 0 AND confirmed_at IS NOT NULL AND confirmed_by_membership_id IS NOT NULL)
    OR (execution_status <> 'DA_HOAN_THANH' AND completed_date IS NULL AND completion_summary IS NULL AND due_date_at_completion IS NULL AND confirmed_at IS NULL AND confirmed_by_membership_id IS NULL)),
  FOREIGN KEY(tenant_id,source_id) REFERENCES task_sources(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,source_document_id) REFERENCES source_documents(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,lead_unit_id) REFERENCES organization_units(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,leader_id) REFERENCES leaders(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,office_owner_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,updated_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,confirmed_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE UNIQUE INDEX uq_task_external_ref ON tasks(tenant_id,external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX idx_tasks_unit_year ON tasks(tenant_id,lead_unit_id,assigned_date);
CREATE INDEX idx_tasks_source_leader ON tasks(tenant_id,source_id,leader_id,assigned_date);
CREATE INDEX idx_tasks_execution_due ON tasks(tenant_id,execution_status,original_due_date);
CREATE INDEX idx_tasks_source_document ON tasks(tenant_id,source_document_id);
CREATE INDEX idx_tasks_leader ON tasks(tenant_id,leader_id);

CREATE TABLE task_coordinating_units (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  PRIMARY KEY(tenant_id,task_id,unit_id),
  FOREIGN KEY(tenant_id,task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,unit_id) REFERENCES organization_units(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_coordinators_unit ON task_coordinating_units(tenant_id,unit_id,task_id);

CREATE TABLE task_progress_updates (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL,
  report_date TEXT NOT NULL CHECK(length(report_date)=10 AND date(report_date,'+0 days') IS NOT NULL AND date(report_date,'+0 days')=report_date),
  content TEXT NOT NULL CHECK(length(trim(content)) > 0),
  percent INTEGER CHECK(percent BETWEEN 0 AND 100),
  difficulty TEXT,
  created_by_membership_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(tenant_id,id),
  FOREIGN KEY(tenant_id,task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_progress_task ON task_progress_updates(tenant_id,task_id,report_date,created_at);

CREATE TABLE expedite_documents (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  document_kind TEXT NOT NULL DEFAULT 'DOCUMENT' CHECK(document_kind IN ('DOCUMENT','INTERNAL_NOTE')),
  reference_no TEXT,
  issued_date TEXT NOT NULL CHECK(length(issued_date)=10 AND date(issued_date,'+0 days') IS NOT NULL AND date(issued_date,'+0 days')=issued_date),
  sent_date TEXT CHECK(sent_date IS NULL OR (length(sent_date)=10 AND date(sent_date,'+0 days') IS NOT NULL AND date(sent_date,'+0 days')=sent_date)),
  issuer TEXT,
  signer TEXT,
  summary TEXT,
  content TEXT NOT NULL CHECK(length(trim(content)) > 0),
  response_due_date TEXT CHECK(response_due_date IS NULL OR (length(response_due_date)=10 AND date(response_due_date,'+0 days') IS NOT NULL AND date(response_due_date,'+0 days')=response_due_date)),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','CANCELLED')),
  cancelled_at TEXT,
  cancellation_reason TEXT,
  created_by_membership_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  UNIQUE(tenant_id,id),
  CHECK(document_kind <> 'DOCUMENT' OR (reference_no IS NOT NULL AND length(trim(reference_no)) > 0)),
  CHECK((status='ACTIVE' AND cancelled_at IS NULL AND cancellation_reason IS NULL) OR (status='CANCELLED' AND cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL AND length(trim(cancellation_reason)) > 0)),
  FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_expedite_reference ON expedite_documents(tenant_id,reference_no,issued_date);

CREATE TABLE expedite_document_tasks (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  expedite_document_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  PRIMARY KEY(tenant_id,expedite_document_id,task_id),
  FOREIGN KEY(tenant_id,expedite_document_id) REFERENCES expedite_documents(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_expedite_task ON expedite_document_tasks(tenant_id,task_id,expedite_document_id);

CREATE TABLE extension_requests (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK(sequence > 0),
  requesting_unit_id TEXT NOT NULL,
  request_reference_no TEXT NOT NULL CHECK(length(trim(request_reference_no)) > 0),
  request_date TEXT NOT NULL CHECK(length(request_date)=10 AND date(request_date,'+0 days') IS NOT NULL AND date(request_date,'+0 days')=request_date),
  reason TEXT NOT NULL CHECK(length(trim(reason)) > 0),
  previous_due_date TEXT NOT NULL CHECK(length(previous_due_date)=10 AND date(previous_due_date,'+0 days') IS NOT NULL AND date(previous_due_date,'+0 days')=previous_due_date),
  proposed_due_date TEXT NOT NULL CHECK(length(proposed_due_date)=10 AND date(proposed_due_date,'+0 days') IS NOT NULL AND date(proposed_due_date,'+0 days')=proposed_due_date AND proposed_due_date > previous_due_date),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  response_reference_no TEXT,
  response_date TEXT CHECK(response_date IS NULL OR (length(response_date)=10 AND date(response_date,'+0 days') IS NOT NULL AND date(response_date,'+0 days')=response_date AND response_date >= request_date)),
  response_issuer TEXT,
  response_signer TEXT,
  approved_due_date TEXT CHECK(approved_due_date IS NULL OR (length(approved_due_date)=10 AND date(approved_due_date,'+0 days') IS NOT NULL AND date(approved_due_date,'+0 days')=approved_due_date AND approved_due_date > previous_due_date)),
  decided_by_membership_id TEXT,
  decided_at TEXT,
  created_by_membership_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,task_id,sequence),
  CHECK((status='PENDING' AND response_reference_no IS NULL AND response_date IS NULL AND response_issuer IS NULL AND response_signer IS NULL AND approved_due_date IS NULL AND decided_by_membership_id IS NULL AND decided_at IS NULL)
    OR (status IN ('APPROVED','REJECTED') AND response_reference_no IS NOT NULL AND length(trim(response_reference_no)) > 0 AND response_date IS NOT NULL AND decided_by_membership_id IS NOT NULL AND decided_at IS NOT NULL AND length(trim(decided_at)) > 0 AND ((status='APPROVED' AND approved_due_date IS NOT NULL) OR (status='REJECTED' AND approved_due_date IS NULL)))),
  FOREIGN KEY(tenant_id,task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,requesting_unit_id) REFERENCES organization_units(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,decided_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE UNIQUE INDEX uq_one_pending_extension ON extension_requests(tenant_id,task_id) WHERE status='PENDING';
CREATE INDEX idx_extension_history ON extension_requests(tenant_id,task_id,status,sequence DESC);

CREATE TABLE import_jobs (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  file_name TEXT NOT NULL CHECK(length(trim(file_name)) > 0),
  file_sha256 TEXT CHECK(file_sha256 IS NULL OR (length(file_sha256)=64 AND file_sha256 NOT GLOB '*[^0-9a-f]*')),
  sheet_name TEXT NOT NULL DEFAULT 'NHAP_NHIEM_VU' CHECK(sheet_name='NHAP_NHIEM_VU'),
  header_row INTEGER NOT NULL DEFAULT 5 CHECK(header_row=5),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','VALIDATED','COMMITTED','FAILED','CANCELLED')),
  duplicate_policy TEXT NOT NULL DEFAULT 'SKIP' CHECK(duplicate_policy IN ('SKIP','UPDATE','CREATE')),
  idempotency_key TEXT NOT NULL CHECK(length(trim(idempotency_key)) > 0),
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK(total_rows >= 0),
  validation_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(validation_json) AND json_type(validation_json)='object'),
  created_by_membership_id TEXT NOT NULL,
  confirmed_by_membership_id TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at TEXT,
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
  CHECK(status <> 'COMMITTED' OR (confirmed_by_membership_id IS NOT NULL AND confirmed_at IS NOT NULL AND completed_at IS NOT NULL)),
  FOREIGN KEY(tenant_id,created_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,confirmed_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_import_jobs_time ON import_jobs(tenant_id,created_at);

CREATE TABLE import_job_rows (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  import_job_id TEXT NOT NULL,
  row_number INTEGER NOT NULL CHECK(row_number >= 6),
  status TEXT NOT NULL CHECK(status IN ('VALID','INVALID','DUPLICATE','IMPORTED','SKIPPED','FAILED')),
  input_json TEXT NOT NULL CHECK(json_valid(input_json) AND json_type(input_json)='object'),
  errors_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(errors_json) AND json_type(errors_json)='array'),
  duplicate_task_id TEXT,
  imported_task_id TEXT,
  decision TEXT CHECK(decision IS NULL OR decision IN ('SKIP','UPDATE','CREATE')),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,import_job_id,row_number),
  CHECK(status <> 'IMPORTED' OR imported_task_id IS NOT NULL),
  FOREIGN KEY(tenant_id,import_job_id) REFERENCES import_jobs(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,duplicate_task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,imported_task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE attachments (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  task_id TEXT,
  source_document_id TEXT,
  progress_update_id TEXT,
  expedite_document_id TEXT,
  extension_request_id TEXT,
  import_job_id TEXT,
  document_role TEXT NOT NULL CHECK(document_role IN ('TASK_RESULT','TASK_EVIDENCE','SOURCE','PROGRESS','EXPEDITE','EXTENSION_REQUEST','EXTENSION_DECISION','IMPORT_SOURCE')),
  storage_key TEXT NOT NULL CHECK(length(storage_key) > length(tenant_id)+1 AND substr(storage_key,1,length(tenant_id)+1)=tenant_id || '/'),
  file_name TEXT NOT NULL CHECK(length(trim(file_name)) > 0),
  mime_type TEXT NOT NULL CHECK(length(trim(mime_type)) > 0),
  size_bytes INTEGER NOT NULL CHECK(size_bytes > 0),
  sha256 TEXT CHECK(sha256 IS NULL OR (length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*')),
  upload_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(upload_status IN ('PENDING','READY','FAILED','QUARANTINED')),
  uploaded_by_membership_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,storage_key),
  CHECK((task_id IS NOT NULL)+(source_document_id IS NOT NULL)+(progress_update_id IS NOT NULL)+(expedite_document_id IS NOT NULL)+(extension_request_id IS NOT NULL)+(import_job_id IS NOT NULL)=1),
  CHECK((document_role IN ('TASK_RESULT','TASK_EVIDENCE') AND task_id IS NOT NULL) OR (document_role='SOURCE' AND source_document_id IS NOT NULL) OR (document_role='PROGRESS' AND progress_update_id IS NOT NULL) OR (document_role='EXPEDITE' AND expedite_document_id IS NOT NULL) OR (document_role IN ('EXTENSION_REQUEST','EXTENSION_DECISION') AND extension_request_id IS NOT NULL) OR (document_role='IMPORT_SOURCE' AND import_job_id IS NOT NULL)),
  FOREIGN KEY(tenant_id,task_id) REFERENCES tasks(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,source_document_id) REFERENCES source_documents(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,progress_update_id) REFERENCES task_progress_updates(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,expedite_document_id) REFERENCES expedite_documents(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,extension_request_id) REFERENCES extension_requests(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,import_job_id) REFERENCES import_jobs(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,uploaded_by_membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_attachment_task ON attachments(tenant_id,task_id);
CREATE INDEX idx_attachment_source ON attachments(tenant_id,source_document_id);
CREATE INDEX idx_attachment_progress ON attachments(tenant_id,progress_update_id);
CREATE INDEX idx_attachment_expedite ON attachments(tenant_id,expedite_document_id);
CREATE INDEX idx_attachment_extension ON attachments(tenant_id,extension_request_id);
CREATE INDEX idx_attachment_import ON attachments(tenant_id,import_job_id);

-- The effective due date is derived, never an ordinary UPDATE field on tasks.
CREATE VIEW v_tasks_effective AS
SELECT t.*, COALESCE((SELECT e.approved_due_date FROM extension_requests e
  WHERE e.tenant_id=t.tenant_id AND e.task_id=t.id AND e.status='APPROVED'
  ORDER BY e.sequence DESC LIMIT 1),t.original_due_date) AS effective_due_date
FROM tasks t;
