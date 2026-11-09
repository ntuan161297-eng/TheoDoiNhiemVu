-- Official catalogs only. No profiles, memberships, platform admins, or tasks.
-- CSV parent hierarchy is unspecified: all eleven units start with parent_id NULL.
INSERT INTO tenants(id,code,name,settings_json) VALUES
 ('tenant-huong-do','HUONG_DO','UBND xã Hương Đô','{"business_time_zone":"Asia/Ho_Chi_Minh"}');
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV01','tenant-huong-do','DV01','Văn phòng HĐND - UBND','CHUA_PHAN_LOAI',1,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV02','tenant-huong-do','DV02','Phòng Kinh tế','CHUA_PHAN_LOAI',2,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV03','tenant-huong-do','DV03','Phòng Văn hóa - Xã hội','CHUA_PHAN_LOAI',3,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV04','tenant-huong-do','DV04','Trung tâm Phục vụ hành chính công','CHUA_PHAN_LOAI',4,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV05','tenant-huong-do','DV05','Ban Chỉ huy Quân sự xã Hương Đô','CHUA_PHAN_LOAI',5,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV06','tenant-huong-do','DV06','CÔNG AN XÃ HƯƠNG ĐÔ','CHUA_PHAN_LOAI',6,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV07','tenant-huong-do','DV07','Điện lực Hương Khê','CHUA_PHAN_LOAI',7,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV08','tenant-huong-do','DV08','Trường Mầm non Hương Đô','CHUA_PHAN_LOAI',8,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV09','tenant-huong-do','DV09','Trung tâm dịch vụ tổng hợp','CHUA_PHAN_LOAI',9,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV10','tenant-huong-do','DV10','Trường TH&THCS Hương Đô','CHUA_PHAN_LOAI',10,1);
INSERT INTO organization_units(id,tenant_id,code,name,unit_kind,sort_order,is_active) VALUES ('huong-do-DV11','tenant-huong-do','DV11','Trạm y tế xã Hương Đô','CHUA_PHAN_LOAI',11,1);
INSERT INTO leaders(id,tenant_id,code,full_name,position_name,sort_order,is_active) VALUES ('huong-do-LD01','tenant-huong-do','LD01','Lê Hữu Đồng','Chủ tịch UBND xã',1,1);
INSERT INTO leaders(id,tenant_id,code,full_name,position_name,sort_order,is_active) VALUES ('huong-do-LD02','tenant-huong-do','LD02','Nguyễn Văn Luận','Phó chủ tịch',2,1);
INSERT INTO leaders(id,tenant_id,code,full_name,position_name,sort_order,is_active) VALUES ('huong-do-LD03','tenant-huong-do','LD03','Nguyễn Trung Thương','Phó chủ tịch',3,1);
INSERT INTO task_sources(id,tenant_id,code,name,sort_order,is_active) VALUES ('huong-do-TINH_GIAO','tenant-huong-do','TINH_GIAO','Nhiệm vụ tỉnh giao',1,1);
INSERT INTO task_sources(id,tenant_id,code,name,sort_order,is_active) VALUES ('huong-do-HDND','tenant-huong-do','HDND','Nhiệm vụ HĐND',2,1);
INSERT INTO task_sources(id,tenant_id,code,name,sort_order,is_active) VALUES ('huong-do-KET_LUAN_CUOC_HOP','tenant-huong-do','KET_LUAN_CUOC_HOP','Nhiệm vụ Kết luận cuộc họp',3,1);
INSERT INTO audit_logs(id,scope,tenant_id,actor_kind,action,entity_type,entity_id,after_json)
 VALUES ('seed-huong-do-v1','TENANT','tenant-huong-do','SYSTEM','CATALOG_SEED','tenants','tenant-huong-do','{"units":11,"leaders":3,"sources":3}');
