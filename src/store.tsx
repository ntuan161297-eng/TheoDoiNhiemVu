import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createDemo } from './demo';
import { businessToday, effectiveDue, extensionState, normalize, type DemoData, type Event, type Expedite, type Extension, type FileRef, type Progress, type Task } from './domain';

export type DemoRole = 'OFFICE' | 'VIEWER';
const id = () => crypto.randomUUID();
const event = (title: string, detail: string): Event => ({ id: id(), title, detail, at: new Date().toISOString(), actor: 'Cán bộ Văn phòng · DEMO' });
export interface Store {
  data: DemoData; today: string; role: DemoRole; setRole: (role: DemoRole) => void;
  saveTask: (values: Partial<Task>, taskId?: string) => string;
  saveProgress: (taskId: string, value: Omit<Progress, 'id'>) => void;
  complete: (taskId: string, date: string, result: string, file?: FileRef) => void;
  saveExpedite: (value: Omit<Expedite, 'id'>, editId?: string) => void;
  requestExtension: (value: Omit<Extension, 'id' | 'sequence' | 'state' | 'previousDue'>) => void;
  resolveExtension: (extensionId: string, value: Partial<Extension>) => void;
  importDemo: (tasks: Task[]) => number;
  reset: () => void;
}
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(businessToday);
  const [data, setData] = useState(createDemo);
  const [role, setRole] = useState<DemoRole>('OFFICE');
  useEffect(() => { const timer = setInterval(() => setToday(businessToday()), 30000); return () => clearInterval(timer); }, []);
  const requireWrite = () => { if (role === 'VIEWER') throw new Error('Chế độ lãnh đạo chỉ xem. Chuyển vai trò DEMO để thử nhập liệu.'); };
  const update = (taskId: string, change: Partial<Task>, e: Event) => {
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === taskId ? { ...t, ...change, events: [...t.events, e] } : t) }));
  };
  const store: Store = {
    data, today, role, setRole,
    saveTask(values, taskId) {
      requireWrite();
      const existing = data.tasks.find(t => t.id === taskId);
      const draft = { ...existing, ...values };
      if (!draft.title?.trim() || !draft.source || !draft.unit || !draft.leader || !draft.assigned || !draft.originalDue) throw new Error('Vui lòng điền đầy đủ trường bắt buộc.');
      if (draft.originalDue < draft.assigned) throw new Error('Hạn gốc không được trước ngày giao.');
      if (existing && draft.originalDue !== existing.originalDue) throw new Error('Hạn gốc đã lưu không được ghi đè.');
      if (draft.coordinators?.includes(draft.unit)) throw new Error('Đơn vị phối hợp không được trùng đơn vị chủ trì.');
      if (draft.externalRef && data.tasks.some(t => t.id !== taskId && normalize(t.externalRef || '') === normalize(draft.externalRef!))) throw new Error('Mã đối chiếu đã tồn tại.');
      if (!existing && draft.execution === 'DA_HOAN_THANH') throw new Error('Tạo nhiệm vụ trước, sau đó dùng Xác nhận hoàn thành.');
      const task: Task = {
        id: taskId || id(), code: existing?.code || `NV-${today.slice(0, 4)}-${String(Math.max(0, ...data.tasks.map(t => Number(t.code.split('-').at(-1)) || 0)) + 1).padStart(4, '0')}`,
        title: draft.title.trim(), source: draft.source, unit: draft.unit, leader: draft.leader,
        assigned: draft.assigned, originalDue: draft.originalDue,
        coordinators: [...new Set(draft.coordinators || [])], priority: draft.priority || 'NORMAL',
        execution: existing?.execution === 'DA_HOAN_THANH' ? existing.execution : draft.execution || 'CHUA_THUC_HIEN',
        docNo: draft.docNo || '', progress: existing?.progress || [], events: existing?.events || [],
        ...values,
      };
      task.title = task.title.trim();
      if (existing?.execution === 'DA_HOAN_THANH') task.execution = existing.execution;
      task.events = [...task.events, event(existing ? 'Sửa thông tin nhiệm vụ' : 'Tạo nhiệm vụ minh họa', existing ? `Trước: ${existing.title}; chủ trì ${existing.unit}. Sau: ${task.title}; chủ trì ${task.unit}. Hạn gốc giữ nguyên.` : 'Lưu trong bộ nhớ phiên DEMO; chưa lưu cơ sở dữ liệu.')];
      setData(d => ({ ...d, tasks: existing ? d.tasks.map(t => t.id === taskId ? task : t) : [...d.tasks, task] }));
      return task.id;
    },
    saveProgress(taskId, value) {
      requireWrite(); const t = data.tasks.find(t => t.id === taskId)!;
      if (t.execution === 'DA_HOAN_THANH') throw new Error('Nhiệm vụ đã hoàn thành.');
      if (!value.text.trim()) throw new Error('Cần nhập nội dung cập nhật.');
      if (value.date > today) throw new Error('Ngày cập nhật không được trong tương lai.');
      update(taskId, { progress: [...t.progress, { ...value, id: id() }], percent: value.percent ?? t.percent, execution: 'DANG_THUC_HIEN' }, event('Cập nhật tiến độ', value.text));
    },
    complete(taskId, date, result, file) {
      requireWrite(); const t = data.tasks.find(t => t.id === taskId)!;
      if (!date || !result.trim()) throw new Error('Cần ngày thực tế và nội dung kết quả.');
      if (date > today || date < t.assigned) throw new Error('Ngày thực tế phải từ ngày giao đến hôm nay.');
      if (t.execution === 'DA_HOAN_THANH') throw new Error('Nhiệm vụ đã được xác nhận.');
      const due = effectiveDue(t, data.extensions);
      update(taskId, { execution: 'DA_HOAN_THANH', percent: 100, completedDate: date, result, resultFile: file, completionDue: due, confirmedAt: new Date().toISOString() }, event('Xác nhận hoàn thành', `Ngày thực tế ${date}; hạn tại xác nhận ${due}. ${result}`));
    },
    saveExpedite(value, editId) {
      requireWrite();
      const taskIds = [...new Set(value.taskIds)];
      if (!taskIds.length || !value.number.trim() || !value.date || !value.text.trim() || !value.file) throw new Error('Cần nhiệm vụ, số/ngày văn bản, nội dung và tệp.');
      if (data.expedites.some(d => d.id !== editId && normalize(d.number) === normalize(value.number) && d.date === value.date && normalize(d.issuer) === normalize(value.issuer))) throw new Error('Văn bản này đã được ghi nhận. Hãy sửa bản ghi hiện có để bổ sung nhiệm vụ.');
      const doc = { ...value, taskIds, id: editId || id() };
      const old = data.expedites.find(d => d.id === editId);
      const affected = new Set([...taskIds, ...(old?.taskIds || [])]);
      const e = event(editId ? 'Sửa văn bản đôn đốc' : 'Ghi nhận văn bản đôn đốc', `${doc.number}; ${taskIds.length} nhiệm vụ. ${editId ? `Nội dung trước: ${old?.text}. ` : ''}Nội dung: ${value.text}`);
      setData(d => ({ ...d, expedites: editId ? d.expedites.map(x => x.id === editId ? doc : x) : [...d.expedites, doc], tasks: d.tasks.map(t => affected.has(t.id) ? { ...t, events: [...t.events, e] } : t) }));
    },
    requestExtension(value) {
      requireWrite(); const t = data.tasks.find(t => t.id === value.taskId)!;
      if (t.execution === 'DA_HOAN_THANH') throw new Error('Không thêm đề nghị cho nhiệm vụ đã hoàn thành trong bản DEMO.');
      if (extensionState(t.id, data.extensions) === 'DANG_XIN') throw new Error('Nhiệm vụ đã có một đề nghị đang chờ.');
      const due = effectiveDue(t, data.extensions);
      if (value.proposedDue <= due) throw new Error('Hạn đề nghị phải sau hạn hiệu lực hiện tại.');
      const req: Extension = { ...value, id: id(), state: 'DANG_XIN', previousDue: due, sequence: Math.max(0, ...data.extensions.filter(e => e.taskId === t.id).map(e => e.sequence)) + 1 };
      const e = event('Ghi nhận đề nghị gia hạn', `${req.number}; xin đến ${req.proposedDue}. Hạn hiệu lực vẫn là ${due}.`);
      setData(d => ({ ...d, extensions: [...d.extensions, req], tasks: d.tasks.map(x => x.id === t.id ? { ...x, events: [...x.events, e] } : x) }));
    },
    resolveExtension(extensionId, value) {
      requireWrite(); const req = data.extensions.find(e => e.id === extensionId)!;
      const task = data.tasks.find(t => t.id === req.taskId)!;
      if (req.state !== 'DANG_XIN') throw new Error('Đề nghị đã có kết quả.');
      if (task.execution === 'DA_HOAN_THANH') throw new Error('Không hồi tố quyết định sau hoàn thành trong DEMO. Snapshot kết quả được giữ nguyên.');
      if (!value.responseNo?.trim() || !value.responseDate || !value.responseFile) throw new Error('Cần số/ngày văn bản phản hồi và file căn cứ.');
      if (value.state !== 'DA_DUOC_GIA_HAN' && value.state !== 'KHONG_DUOC_CHAP_THUAN') throw new Error('Chọn kết quả xem xét.');
      if (value.state === 'DA_DUOC_GIA_HAN' && (!value.approvedDue || value.approvedDue <= effectiveDue(task, data.extensions))) throw new Error('Hạn chấp thuận phải sau hạn hiệu lực hiện tại.');
      const e = event(value.state === 'DA_DUOC_GIA_HAN' ? 'Ghi nhận chấp thuận gia hạn' : 'Ghi nhận không chấp thuận', `${value.responseNo}; ${value.state === 'DA_DUOC_GIA_HAN' ? `Hạn ${effectiveDue(task, data.extensions)} → ${value.approvedDue}` : 'Giữ nguyên hạn hiệu lực'}.`);
      setData(d => ({ ...d, extensions: d.extensions.map(x => x.id === extensionId ? { ...x, ...value } : x), tasks: d.tasks.map(t => t.id === req.taskId ? { ...t, events: [...t.events, e] } : t) }));
    },
    importDemo(tasks) {
      requireWrite();
      const incoming = tasks.filter(t => !data.tasks.some(x => x.externalRef === t.externalRef));
      setData(d => ({ ...d, tasks: [...d.tasks, ...incoming.map(t => ({ ...t, events: [...t.events, event('Import kịch bản minh họa', 'Đã xác nhận trong wizard; chỉ thêm bộ nhớ DEMO, không đọc Excel thực tế.')] }))] }));
      return incoming.length;
    },
    reset() { setData(createDemo(today)); },
  };
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useDemo() { const value = useContext(Context); if (!value) throw new Error('Missing DemoProvider'); return value; }
