-- D1 / SQLite only. No Auth users are created by this migration.
CREATE TABLE tenants (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  code TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(code)) > 0),
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED','ARCHIVED')),
  settings_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(settings_json) AND json_type(settings_json) = 'object'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0)
) STRICT;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  identity_issuer TEXT NOT NULL CHECK(length(trim(identity_issuer)) > 0),
  identity_subject TEXT NOT NULL CHECK(length(trim(identity_subject)) > 0),
  display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(identity_issuer,identity_subject)
) STRICT;

CREATE TABLE organization_units (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  parent_id TEXT,
  code TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(code)) > 0),
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  unit_kind TEXT NOT NULL DEFAULT 'CHUA_PHAN_LOAI',
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,code),
  CHECK(parent_id IS NULL OR parent_id <> id),
  FOREIGN KEY(tenant_id,parent_id) REFERENCES organization_units(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_units_tree ON organization_units(tenant_id,parent_id,is_active,sort_order);

CREATE TABLE tenant_memberships (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK(status IN ('INVITED','ACTIVE','SUSPENDED','REVOKED')),
  created_by_profile_id TEXT REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,profile_id), UNIQUE(tenant_id,id,profile_id)
) STRICT;
CREATE INDEX idx_memberships_profile ON tenant_memberships(profile_id,status,tenant_id);

CREATE TABLE tenant_member_roles (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  membership_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('TENANT_ADMIN','OFFICE_EDITOR','OFFICE_CONFIRMER','LEADER_VIEWER')),
  granted_by_profile_id TEXT REFERENCES profiles(id) ON DELETE RESTRICT,
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(tenant_id,membership_id,role),
  FOREIGN KEY(tenant_id,membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE platform_admins (
  profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','REVOKED')),
  granted_by_profile_id TEXT REFERENCES profiles(id) ON DELETE RESTRICT,
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  revoked_at TEXT,
  CHECK((status = 'ACTIVE' AND revoked_at IS NULL) OR (status = 'REVOKED' AND revoked_at IS NOT NULL))
) STRICT;

CREATE TABLE user_unit_assignments (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  membership_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),
  assigned_by_profile_id TEXT REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(tenant_id,membership_id,unit_id),
  FOREIGN KEY(tenant_id,membership_id) REFERENCES tenant_memberships(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,unit_id) REFERENCES organization_units(tenant_id,id) ON DELETE RESTRICT
) STRICT;
CREATE UNIQUE INDEX uq_primary_unit_assignment ON user_unit_assignments(tenant_id,membership_id) WHERE is_primary = 1;
CREATE INDEX idx_assignment_unit ON user_unit_assignments(tenant_id,unit_id);

CREATE TABLE task_sources (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(code)) > 0),
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,code)
) STRICT;

CREATE TABLE leaders (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(code)) > 0),
  full_name TEXT NOT NULL CHECK(length(trim(full_name)) > 0),
  position_name TEXT NOT NULL CHECK(length(trim(position_name)) > 0),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  UNIQUE(tenant_id,id), UNIQUE(tenant_id,code)
) STRICT;

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  scope TEXT NOT NULL CHECK(scope IN ('PLATFORM','TENANT')),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE RESTRICT,
  actor_kind TEXT NOT NULL CHECK(actor_kind IN ('USER','SYSTEM')),
  actor_profile_id TEXT REFERENCES profiles(id) ON DELETE RESTRICT,
  actor_membership_id TEXT,
  action TEXT NOT NULL CHECK(length(trim(action)) > 0),
  entity_type TEXT NOT NULL CHECK(length(trim(entity_type)) > 0),
  entity_id TEXT NOT NULL CHECK(length(trim(entity_id)) > 0),
  before_json TEXT CHECK(before_json IS NULL OR json_valid(before_json)),
  after_json TEXT CHECK(after_json IS NULL OR json_valid(after_json)),
  reason TEXT,
  request_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK((scope = 'PLATFORM' AND tenant_id IS NULL AND actor_membership_id IS NULL) OR (scope = 'TENANT' AND tenant_id IS NOT NULL)),
  CHECK((actor_kind = 'USER' AND actor_profile_id IS NOT NULL) OR (actor_kind = 'SYSTEM' AND actor_profile_id IS NULL AND actor_membership_id IS NULL)),
  CHECK(actor_membership_id IS NULL OR (tenant_id IS NOT NULL AND actor_profile_id IS NOT NULL)),
  FOREIGN KEY(tenant_id,actor_membership_id,actor_profile_id) REFERENCES tenant_memberships(tenant_id,id,profile_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id,created_at,id);
CREATE INDEX idx_audit_entity ON audit_logs(tenant_id,entity_type,entity_id,created_at);
CREATE INDEX idx_audit_platform_time ON audit_logs(scope,created_at,id);

CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON audit_logs BEGIN
  SELECT RAISE(ABORT,'audit_log_is_append_only');
END;
CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON audit_logs BEGIN
  SELECT RAISE(ABORT,'audit_log_is_append_only');
END;

CREATE TRIGGER units_no_cycle_insert BEFORE INSERT ON organization_units WHEN NEW.parent_id IS NOT NULL BEGIN
  SELECT RAISE(ABORT,'organization_unit_cycle') WHERE EXISTS (
    WITH RECURSIVE ancestors(id,parent_id) AS (
      SELECT id,parent_id FROM organization_units WHERE tenant_id = NEW.tenant_id AND id = NEW.parent_id
      UNION
      SELECT u.id,u.parent_id FROM organization_units u JOIN ancestors a ON u.id = a.parent_id WHERE u.tenant_id = NEW.tenant_id
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  );
END;
CREATE TRIGGER units_no_cycle_update BEFORE UPDATE OF parent_id ON organization_units WHEN NEW.parent_id IS NOT NULL BEGIN
  SELECT RAISE(ABORT,'organization_unit_cycle') WHERE EXISTS (
    WITH RECURSIVE ancestors(id,parent_id) AS (
      SELECT id,parent_id FROM organization_units WHERE tenant_id = NEW.tenant_id AND id = NEW.parent_id
      UNION
      SELECT u.id,u.parent_id FROM organization_units u JOIN ancestors a ON u.id = a.parent_id WHERE u.tenant_id = NEW.tenant_id
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  );
END;
CREATE TRIGGER profiles_identity_immutable BEFORE UPDATE OF identity_issuer,identity_subject ON profiles
WHEN NEW.identity_issuer <> OLD.identity_issuer OR NEW.identity_subject <> OLD.identity_subject BEGIN
  SELECT RAISE(ABORT,'profile_identity_is_immutable');
END;
