import { describe, expect, it } from 'vitest';
import { createDemo, leaders, sources, units } from './demo';
import { addDays, bucket, businessToday, effectiveDue, expediteCount, extensionState, filterTasks, isLate, stats } from './domain';

const today = '2026-11-04';
describe('Ngày nghiệp vụ và cảnh báo V1.3', () => {
  it.each([[6, 'CON_HAN'], [5, 'NGUY_CO_CHAM'], [3, 'NGUY_CO_CHAM'], [2, 'SAP_DEN_HAN_KHAN'], [0, 'SAP_DEN_HAN_KHAN'], [-1, 'QUA_HAN']])('Còn %s ngày → %s', (offset, expected) => {
    const task = { ...createDemo(today).tasks[0], originalDue: addDays(today, Number(offset)) };
    expect(bucket(task, [], today)).toBe(expected);
  });
  it('đổi ngày tại nửa đêm Việt Nam, không theo UTC máy người dùng', () => {
    expect(businessToday(new Date('2026-11-04T16:59:59Z'))).toBe('2026-11-04');
    expect(businessToday(new Date('2026-11-04T17:00:00Z'))).toBe('2026-11-05');
  });
  it('đề nghị đang chờ/từ chối không thay hạn; xin lần 2 dùng hạn duyệt lần 1', () => {
    const d = createDemo(today);
    expect(effectiveDue(d.tasks[0], d.extensions)).toBe(d.tasks[0].originalDue);
    expect(bucket(d.tasks[0], d.extensions, today)).toBe('QUA_HAN');
    expect(effectiveDue(d.tasks[1], d.extensions)).toBe(d.tasks[1].originalDue);
    expect(extensionState(d.tasks[7].id, d.extensions)).toBe('DANG_XIN');
    expect(effectiveDue(d.tasks[7], d.extensions)).toBe(addDays(today, 18));
    expect(d.tasks[7].originalDue).toBe(addDays(today, 14));
  });
  it('ngày hoàn thành thực tế đối chiếu snapshot, không đối chiếu ngày xác nhận', () => {
    const t = { ...createDemo(today).tasks[11], completedDate: today, completionDue: today, confirmedAt: addDays(today, 1) };
    expect(isLate(t)).toBe(false);
    expect(isLate({ ...t, completedDate: addDays(today, 1) })).toBe(true);
    expect(bucket(t, [], today)).toBeUndefined();
  });
});
describe('Đếm nhiệm vụ và văn bản', () => {
  it('đúng 11 đơn vị, ba nguồn, ba lãnh đạo từ seed', () => {
    expect(units).toHaveLength(11); expect(sources).toHaveLength(3); expect(leaders).toHaveLength(3);
    expect(units.find(u => u.id === 'DV06')?.name).toBe('CÔNG AN XÃ HƯƠNG ĐÔ');
  });
  it('tiến độ minh họa hiện hành khớp bản cập nhật gần nhất', () => {
    for (const t of createDemo(today).tasks) {
      if (t.progress.length) expect(t.percent).toBe(t.progress.at(-1)!.percent);
    }
  });
  it('văn bản chung đếm mỗi nhiệm vụ một lần; sửa văn bản không tạo lượt mới', () => {
    const d = createDemo(today);
    expect(expediteCount('task-1', d.expedites)).toBe(3);
    expect(expediteCount('task-2', d.expedites)).toBe(1);
    expect(expediteCount('task-3', d.expedites)).toBe(1);
    const s = stats(d.tasks, d, today);
    expect(s.expedited).toBe(4); expect(s.expediteTotal).toBe(6);
    const edited = d.expedites.map(x => ({ ...x, text: 'Đã sửa' }));
    expect(expediteCount('task-1', edited)).toBe(3);
    expect(expediteCount('task-1', edited.map(x => x.id === 'exp-3' ? { ...x, cancelled: true } : x))).toBe(2);
  });
  it('KPI phân hoạch đúng, không nhân dòng bởi phối hợp hoặc nhiều văn bản', () => {
    const d = createDemo(today); const s = stats([...d.tasks, d.tasks[0]], d, today);
    expect(s.total).toBe(d.tasks.length);
    expect(s.total).toBe(s.completed + s.pending);
    expect(s.pending).toBe(s.onTrack + s.risk + s.urgent + s.overdue);
    expect(s.late).toBeLessThanOrEqual(s.completed);
    expect(units.reduce((sum, u) => sum + stats(d.tasks.filter(t => t.unit === u.id), d, today).total, 0)).toBe(s.total);
  });
  it('lọc nhiều trường AND, KPI drill-down giữ tập lọc, phối hợp không thay chủ trì', () => {
    const d = createDemo(today); const t = d.tasks[0];
    const f = { source: t.source, leader: t.leader, unit: t.unit };
    const base = filterTasks(d, f, today);
    const drill = filterTasks(d, { ...f, deadline: 'QUA_HAN' }, today);
    expect(drill.length).toBe(stats(base, d, today).overdue);
    expect(filterTasks(d, { coordinator: t.coordinators[0] }, today).some(x => x.id === t.id)).toBe(true);
    expect(t.unit).not.toBe(t.coordinators[0]);
    expect(filterTasks(d, { search: 'từ khóa không tồn tại' }, today)).toHaveLength(0);
  });
});
