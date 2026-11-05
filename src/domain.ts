export type Execution = 'CHUA_THUC_HIEN' | 'DANG_THUC_HIEN' | 'DA_HOAN_THANH';
export type Deadline = 'CON_HAN' | 'NGUY_CO_CHAM' | 'SAP_DEN_HAN_KHAN' | 'QUA_HAN';
export type ExtensionState = 'KHONG_XIN' | 'DANG_XIN' | 'DA_DUOC_GIA_HAN' | 'KHONG_DUOC_CHAP_THUAN';
export interface Lookup { id: string; name: string; title?: string }
export interface FileRef { name: string; url?: string; demo?: boolean }
export interface Event { id: string; at: string; actor: string; title: string; detail: string }
export interface Progress { id: string; date: string; text: string; percent?: number; difficulty?: string; file?: FileRef }
export interface Task {
  id: string; code: string; externalRef?: string; source: string; unit: string; leader: string;
  title: string; assigned: string; originalDue: string; coordinators: string[];
  priority: 'NORMAL' | 'HIGH' | 'URGENT'; execution: Execution;
  docNo: string; docDate?: string; issuer?: string; summary?: string; sourceFile?: FileRef;
  field?: string; owner?: string; note?: string; percent?: number;
  completedDate?: string; result?: string; completionDue?: string; confirmedAt?: string; resultFile?: FileRef;
  progress: Progress[]; events: Event[];
}
export interface Expedite {
  id: string; taskIds: string[]; number: string; date: string; sentDate?: string; issuer: string;
  signer?: string; summary?: string; text: string; responseDue?: string; file: FileRef; cancelled?: boolean;
}
export interface Extension {
  id: string; taskId: string; sequence: number; number: string; date: string; unit: string;
  reason: string; previousDue: string; proposedDue: string; file: FileRef;
  state: 'DANG_XIN' | 'DA_DUOC_GIA_HAN' | 'KHONG_DUOC_CHAP_THUAN';
  responseNo?: string; responseDate?: string; responseIssuer?: string; approvedDue?: string; responseFile?: FileRef;
}
export interface DemoData { tasks: Task[]; expedites: Expedite[]; extensions: Extension[] }
export interface Filters {
  search?: string; year?: string; source?: string; unit?: string; leader?: string;
  execution?: string; deadline?: string; extension?: string; from?: string; to?: string;
  priority?: string; coordinator?: string; expedited?: string;
}
export const executionLabels: Record<Execution, string> = {
  CHUA_THUC_HIEN: 'Chưa thực hiện', DANG_THUC_HIEN: 'Đang thực hiện', DA_HOAN_THANH: 'Đã hoàn thành',
};
export const deadlineLabels: Record<Deadline, string> = {
  CON_HAN: 'Còn hạn', NGUY_CO_CHAM: 'Nguy cơ chậm', SAP_DEN_HAN_KHAN: 'Sắp đến hạn · Khẩn', QUA_HAN: 'Quá hạn',
};
export const extensionLabels: Record<ExtensionState, string> = {
  KHONG_XIN: 'Chưa xin gia hạn', DANG_XIN: 'Đang xin gia hạn', DA_DUOC_GIA_HAN: 'Đã được gia hạn', KHONG_DUOC_CHAP_THUAN: 'Không được chấp thuận',
};
export function businessToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k)!.value).join('-');
}
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) { return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000); }
export function fmt(date?: string) { return date ? date.slice(0, 10).split('-').reverse().join('/') : '—'; }
export function normalize(s: string) { return s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi'); }
export function effectiveDue(task: Task, extensions: Extension[]) {
  return extensions.filter(e => e.taskId === task.id && e.state === 'DA_DUOC_GIA_HAN')
    .sort((a, b) => b.sequence - a.sequence)[0]?.approvedDue || task.originalDue;
}
export function extensionState(taskId: string, extensions: Extension[]): ExtensionState {
  return extensions.filter(e => e.taskId === taskId).sort((a, b) => b.sequence - a.sequence)[0]?.state || 'KHONG_XIN';
}
export function bucket(task: Task, extensions: Extension[], today: string): Deadline | undefined {
  if (task.execution === 'DA_HOAN_THANH') return undefined;
  const d = daysBetween(effectiveDue(task, extensions), today);
  return d < 0 ? 'QUA_HAN' : d <= 2 ? 'SAP_DEN_HAN_KHAN' : d <= 5 ? 'NGUY_CO_CHAM' : 'CON_HAN';
}
export function isLate(task: Task) { return task.execution === 'DA_HOAN_THANH' && !!task.completedDate && !!task.completionDue && task.completedDate > task.completionDue; }
export function expediteCount(id: string, docs: Expedite[]) { return docs.filter(d => !d.cancelled && d.taskIds.includes(id)).length; }
export function filterTasks(data: DemoData, f: Filters, today: string) {
  return data.tasks.filter(t => (!f.search || normalize([t.title, t.code, t.docNo, t.externalRef].join(' ')).includes(normalize(f.search)))
    && (!f.year || t.assigned.startsWith(f.year)) && (!f.source || t.source === f.source)
    && (!f.unit || t.unit === f.unit) && (!f.leader || t.leader === f.leader)
    && (!f.execution || (f.execution === 'PENDING' ? t.execution !== 'DA_HOAN_THANH' : f.execution === 'LATE' ? isLate(t) : t.execution === f.execution))
    && (!f.deadline || bucket(t, data.extensions, today) === f.deadline)
    && (!f.extension || extensionState(t.id, data.extensions) === f.extension)
    && (!f.from || t.assigned >= f.from) && (!f.to || t.assigned <= f.to)
    && (!f.priority || t.priority === f.priority) && (!f.coordinator || t.coordinators.includes(f.coordinator))
    && (!f.expedited || (f.expedited === 'yes') === (expediteCount(t.id, data.expedites) > 0)));
}
export function stats(tasks: Task[], data: DemoData, today: string) {
  const unique = [...new Map(tasks.map(t => [t.id, t])).values()];
  return {
    total: unique.length, completed: unique.filter(t => t.execution === 'DA_HOAN_THANH').length,
    pending: unique.filter(t => t.execution !== 'DA_HOAN_THANH').length,
    onTrack: unique.filter(t => bucket(t, data.extensions, today) === 'CON_HAN').length,
    risk: unique.filter(t => bucket(t, data.extensions, today) === 'NGUY_CO_CHAM').length,
    urgent: unique.filter(t => bucket(t, data.extensions, today) === 'SAP_DEN_HAN_KHAN').length,
    overdue: unique.filter(t => bucket(t, data.extensions, today) === 'QUA_HAN').length,
    late: unique.filter(isLate).length,
    requesting: unique.filter(t => extensionState(t.id, data.extensions) === 'DANG_XIN').length,
    expedited: unique.filter(t => expediteCount(t.id, data.expedites) > 0).length,
    expediteTotal: unique.reduce((sum, t) => sum + expediteCount(t.id, data.expedites), 0),
  };
}
export function prioritySort(tasks: Task[], data: DemoData, today: string) {
  const ranks = { QUA_HAN: 0, SAP_DEN_HAN_KHAN: 1, NGUY_CO_CHAM: 2, CON_HAN: 3 };
  return [...tasks].sort((a, b) => (ranks[bucket(a, data.extensions, today)!] ?? 4) - (ranks[bucket(b, data.extensions, today)!] ?? 4)
    || effectiveDue(a, data.extensions).localeCompare(effectiveDue(b, data.extensions)) || a.code.localeCompare(b.code));
}
