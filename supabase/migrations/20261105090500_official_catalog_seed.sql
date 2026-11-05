-- Official CSV catalog only; never seed auth.users, roles or demo tasks here.
-- Atomic transaction is managed by the Supabase migration runner.
insert into public.units(id,code,name,unit_kind,sort_order,is_active) values
('11000000-0000-4000-8000-000000000001','DV01','Văn phòng HĐND - UBND','CHUA_PHAN_LOAI',1,true),
('11000000-0000-4000-8000-000000000002','DV02','Phòng Kinh tế','CHUA_PHAN_LOAI',2,true),
('11000000-0000-4000-8000-000000000003','DV03','Phòng Văn hóa - Xã hội','CHUA_PHAN_LOAI',3,true),
('11000000-0000-4000-8000-000000000004','DV04','Trung tâm Phục vụ hành chính công','CHUA_PHAN_LOAI',4,true),
('11000000-0000-4000-8000-000000000005','DV05','Ban Chỉ huy Quân sự xã Hương Đô','CHUA_PHAN_LOAI',5,true),
('11000000-0000-4000-8000-000000000006','DV06','CÔNG AN XÃ HƯƠNG ĐÔ','CHUA_PHAN_LOAI',6,true),
('11000000-0000-4000-8000-000000000007','DV07','Điện lực Hương Khê','CHUA_PHAN_LOAI',7,true),
('11000000-0000-4000-8000-000000000008','DV08','Trường Mầm non Hương Đô','CHUA_PHAN_LOAI',8,true),
('11000000-0000-4000-8000-000000000009','DV09','Trung tâm dịch vụ tổng hợp','CHUA_PHAN_LOAI',9,true),
('11000000-0000-4000-8000-000000000010','DV10','Trường TH&THCS Hương Đô','CHUA_PHAN_LOAI',10,true),
('11000000-0000-4000-8000-000000000011','DV11','Trạm y tế xã Hương Đô','CHUA_PHAN_LOAI',11,true);
insert into public.leaders(id,code,full_name,position_name,sort_order,is_active) values
('22000000-0000-4000-8000-000000000001','LD01','Lê Hữu Đồng','Chủ tịch UBND xã',1,true),
('22000000-0000-4000-8000-000000000002','LD02','Nguyễn Văn Luận','Phó chủ tịch',2,true),
('22000000-0000-4000-8000-000000000003','LD03','Nguyễn Trung Thương','Phó chủ tịch',3,true);
insert into public.task_sources(id,code,name,sort_order,is_active) values
('33000000-0000-4000-8000-000000000001','TINH_GIAO','Nhiệm vụ tỉnh giao',1,true),
('33000000-0000-4000-8000-000000000002','HDND','Nhiệm vụ HĐND',2,true),
('33000000-0000-4000-8000-000000000003','KET_LUAN_CUOC_HOP','Nhiệm vụ Kết luận cuộc họp',3,true);
do $counts$
begin
  if (select count(*) from public.units) <> 11 or (select count(*) from public.leaders) <> 3
    or (select count(*) from public.task_sources) <> 3 then raise exception 'Catalog seed count mismatch'; end if;
end;
$counts$;
