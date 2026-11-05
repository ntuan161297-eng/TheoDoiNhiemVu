import unitsCsv from '../docs/product/seed/don_vi_duoc_giao.csv?raw';
import leadersCsv from '../docs/product/seed/lanh_dao_chi_dao.csv?raw';
import sourcesCsv from '../docs/product/seed/nguon_nhiem_vu.csv?raw';
import { addDays, businessToday, type DemoData, type Lookup, type Task } from './domain';

function readCsv(csv: string): Lookup[] {
  return csv.trim().replace(/^\uFEFF/, '').split(/\r?\n/).slice(1).map(line => {
    const cells = line.split(','); return { id: cells[0], name: cells[1], title: cells[2] };
  });
}
export const units = readCsv(unitsCsv);
export const leaders = readCsv(leadersCsv);
export const sources = readCsv(sourcesCsv);
export const demoFile = { name: 'Tai_lieu_MINH_HOA.txt', demo: true };
export const names = [
  'Tổng hợp báo cáo kết quả thực hiện nhiệm vụ phát triển kinh tế – xã hội',
  'Rà soát hồ sơ và tiến độ giải quyết kiến nghị về đất đai',
  'Chuẩn bị nội dung phiên họp thường kỳ UBND xã',
  'Báo cáo kết quả thực hiện kiến nghị sau giám sát của HĐND',
  'Kiểm tra phương án phòng, chống thiên tai và tìm kiếm cứu nạn',
  'Rà soát công tác bảo đảm an ninh, trật tự trên địa bàn',
  'Phối hợp kiểm tra an toàn hệ thống điện trước mùa mưa bão',
  'Báo cáo công tác bảo đảm an toàn cho trẻ tại cơ sở giáo dục',
  'Tổng hợp phương án duy tu các tuyến đường giao thông nông thôn',
  'Rà soát điều kiện cơ sở vật chất và thiết bị dạy học',
  'Cập nhật kế hoạch phòng, chống dịch bệnh trên địa bàn xã',
  'Hoàn thiện báo cáo cải cách hành chính và chuyển đổi số',
  'Tổng hợp danh mục công trình cần sửa chữa trong năm',
  'Rà soát kết quả thực hiện chính sách an sinh xã hội',
  'Đánh giá chất lượng phục vụ tại Bộ phận Một cửa',
  'Báo cáo kết quả diễn tập phòng thủ và công tác quốc phòng',
  'Tổng hợp tình hình xử lý phản ánh, kiến nghị của công dân',
  'Chuẩn bị tài liệu phục vụ kỳ họp HĐND xã',
];
export function createDemo(today = businessToday()): DemoData {
  const offsets = [-7, -3, 0, 2, 4, 5, 9, 14, -1, 3, 7, -4, -8, -6, -3, -2, -5, 12];
  const tasks: Task[] = names.map((title, i) => {
    const completed = [11, 12, 13, 14, 15].includes(i);
    const originalDue = addDays(today, offsets[i]);
    return {
      id: `task-${i + 1}`, code: `NV-${today.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`,
      externalRef: `DEMO-HD-${i + 1}`, title, source: sources[i % 3].id,
      unit: units[i % 11].id, leader: leaders[i % 3].id,
      assigned: addDays(today, -25 - i % 5), originalDue,
      coordinators: i % 3 === 0 ? [units[(i + 1) % 11].id, units[(i + 2) % 11].id] : [],
      priority: i % 6 === 0 ? 'URGENT' : i % 3 === 0 ? 'HIGH' : 'NORMAL',
      execution: completed ? 'DA_HOAN_THANH' : i % 5 === 2 ? 'CHUA_THUC_HIEN' : 'DANG_THUC_HIEN',
      docNo: `DEMO-${String(21 + Math.floor(i / 3)).padStart(3, '0')}/UBND`,
      docDate: addDays(today, -28), issuer: i % 3 === 0 ? 'UBND tỉnh (minh họa)' : 'UBND xã Hương Đô (minh họa)',
      summary: 'Nội dung chỉ đạo minh họa để kiểm tra giao diện; không phải văn bản thực tế.', sourceFile: demoFile,
      field: ['Tổng hợp', 'Kinh tế', 'Văn hóa – Xã hội'][i % 3], owner: 'Chuyên viên Văn phòng (DEMO)',
      percent: completed ? 100 : i % 5 === 2 ? 0 : 25 + i % 4 * 15,
      completedDate: completed ? addDays(originalDue, i % 2 ? -1 : 1) : undefined,
      completionDue: completed ? originalDue : undefined,
      confirmedAt: completed ? `${today}T08:30:00+07:00` : undefined,
      result: completed ? 'Đã tổng hợp kết quả và rà soát hồ sơ (nội dung minh họa).' : undefined,
      resultFile: completed ? demoFile : undefined,
      progress: completed || i % 5 !== 2 ? [{ id: `progress-${i}`, date: addDays(today, -2), text: 'Văn phòng đã tiếp nhận thông tin và đang tổng hợp báo cáo của đơn vị. Nội dung minh họa.', percent: completed ? 100 : 25 + i % 4 * 15 }] : [],
      events: [{ id: `event-${i}`, at: `${addDays(today, -25 - i % 5)}T08:00:00+07:00`, actor: 'Cán bộ Văn phòng · DEMO', title: 'Ghi nhận nhiệm vụ', detail: 'Tạo dữ liệu minh họa, không phải nhiệm vụ hành chính thực tế.' }],
    };
  });
  const data: DemoData = { tasks,
    expedites: [
      { id: 'exp-1', taskIds: ['task-1', 'task-2', 'task-3'], number: 'DEMO-01/VP', date: addDays(today, -4), issuer: 'Văn phòng HĐND - UBND', text: 'Đề nghị đơn vị tổng hợp tình hình và báo cáo tiến độ (minh họa).', signer: 'Người ký minh họa', file: demoFile },
      { id: 'exp-2', taskIds: ['task-1', 'task-9'], number: 'DEMO-02/VP', date: addDays(today, -1), issuer: 'Văn phòng HĐND - UBND', text: 'Đề nghị khẩn trương hoàn thiện nội dung còn tồn đọng (minh họa).', file: demoFile },
      { id: 'exp-3', taskIds: ['task-1'], number: 'DEMO-03/VP', date: today, issuer: 'Văn phòng HĐND - UBND', text: 'Ghi nhận lần đôn đốc tiếp theo để kiểm tra số đếm (minh họa).', file: demoFile },
    ],
    extensions: [
      { id: 'ext-1', taskId: 'task-1', sequence: 1, number: 'DEMO-XGH-01', date: addDays(today, -2), unit: tasks[0].unit, reason: 'Cần thêm thời gian tổng hợp số liệu (minh họa).', previousDue: tasks[0].originalDue, proposedDue: addDays(today, 7), file: demoFile, state: 'DANG_XIN' },
      { id: 'ext-2', taskId: 'task-8', sequence: 1, number: 'DEMO-XGH-02', date: addDays(today, -3), unit: tasks[7].unit, reason: 'Bổ sung tài liệu liên quan (minh họa).', previousDue: tasks[7].originalDue, proposedDue: addDays(today, 20), file: demoFile, state: 'DA_DUOC_GIA_HAN', approvedDue: addDays(today, 18), responseNo: 'DEMO-DUYET-02', responseDate: addDays(today, -1), responseIssuer: 'Cơ quan có thẩm quyền (minh họa)', responseFile: demoFile },
      { id: 'ext-3', taskId: 'task-2', sequence: 1, number: 'DEMO-XGH-03', date: addDays(today, -5), unit: tasks[1].unit, reason: 'Đề nghị lùi thời gian báo cáo (minh họa).', previousDue: tasks[1].originalDue, proposedDue: addDays(today, 4), file: demoFile, state: 'KHONG_DUOC_CHAP_THUAN', responseNo: 'DEMO-TL-03', responseDate: addDays(today, -2), responseFile: demoFile },
      { id: 'ext-4', taskId: 'task-8', sequence: 2, number: 'DEMO-XGH-04', date: today, unit: tasks[7].unit, reason: 'Xin tiếp sau lần chấp thuận đầu (minh họa).', previousDue: addDays(today, 18), proposedDue: addDays(today, 25), file: demoFile, state: 'DANG_XIN' },
      { id: 'ext-5', taskId: 'task-7', sequence: 1, number: 'DEMO-XGH-05', date: addDays(today, -2), unit: tasks[6].unit, reason: 'Phối hợp rà soát thêm hồ sơ (minh họa).', previousDue: tasks[6].originalDue, proposedDue: addDays(today, 16), approvedDue: addDays(today, 15), file: demoFile, state: 'DA_DUOC_GIA_HAN', responseNo: 'DEMO-DUYET-05', responseDate: today, responseFile: demoFile },
    ],
  };
  for (const task of data.tasks) {
    for (const p of task.progress) task.events.push({ id: `seed-${p.id}`, at: `${p.date}T09:00:00+07:00`, actor: 'Văn phòng · DEMO', title: 'Cập nhật tiến độ', detail: p.text });
    for (const doc of data.expedites.filter(d => d.taskIds.includes(task.id))) task.events.push({ id: `seed-${doc.id}-${task.id}`, at: `${doc.date}T10:00:00+07:00`, actor: 'Văn phòng · DEMO', title: 'Ghi nhận văn bản đôn đốc', detail: `${doc.number} · ${doc.text}` });
    for (const req of data.extensions.filter(e => e.taskId === task.id)) {
      task.events.push({ id: `seed-${req.id}`, at: `${req.date}T11:00:00+07:00`, actor: 'Văn phòng · DEMO', title: 'Ghi nhận đề nghị gia hạn', detail: `${req.number} · Xin đến ${req.proposedDue}; vẫn áp dụng hạn ${req.previousDue} khi chờ.` });
      if (req.responseDate) task.events.push({ id: `seed-response-${req.id}`, at: `${req.responseDate}T13:00:00+07:00`, actor: 'Văn phòng · DEMO', title: req.state === 'DA_DUOC_GIA_HAN' ? 'Ghi nhận chấp thuận gia hạn' : 'Ghi nhận không chấp thuận', detail: `${req.responseNo} · ${req.approvedDue ? `Hạn được duyệt ${req.approvedDue}` : 'Giữ nguyên hạn hiệu lực'}.` });
    }
    if (task.completedDate) task.events.push({ id: `seed-completed-${task.id}`, at: task.confirmedAt!, actor: 'Văn phòng · DEMO', title: 'Xác nhận hoàn thành', detail: `Ngày thực tế ${task.completedDate}; hạn đối chiếu ${task.completionDue}. ${task.result}` });
    task.events.sort((a, b) => a.at.localeCompare(b.at));
  }
  return data;
}
