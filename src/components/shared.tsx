import { App, Button, Tag, Tooltip, Upload, type UploadProps, Empty } from 'antd';
import { FileTextOutlined, UploadOutlined, ArrowRightOutlined } from './icons';
import { bucket, daysBetween, deadlineLabels, effectiveDue, executionLabels, extensionLabels, extensionState, fmt, isLate, type FileRef, type Task } from '../domain';
import { downloadFile } from '../files';
import { useDemo } from '../store';

export function FileLink({ file }: { file?: FileRef }) {
  return file ? <Button type="link" className="file-link" icon={<FileTextOutlined />} onClick={() => downloadFile(file)}>{file.name}{file.demo ? ' · mẫu' : ''}</Button> : <span className="muted">Chưa đính kèm</span>;
}
export function FileField({ value, onChange }: { value?: FileRef; onChange?: (v?: FileRef) => void }) {
  const { message } = App.useApp();
  const upload: UploadProps = { accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg,.txt', maxCount: 1, showUploadList: false,
    beforeUpload(file) {
      if (file.size > 10 * 1024 * 1024) { message.error('Tệp minh họa tối đa 10 MB.'); return Upload.LIST_IGNORE; }
      if (!/\.(pdf|docx?|png|jpe?g|txt)$/i.test(file.name)) { message.error('Chọn PDF, Word, ảnh hoặc TXT cho phiên DEMO.'); return Upload.LIST_IGNORE; }
      onChange?.({ name: file.name, url: URL.createObjectURL(file) }); return false;
    },
  };
  return <div className="file-field"><Upload {...upload}><Button icon={<UploadOutlined />}>Chọn tệp minh họa</Button></Upload>{value && <span className="chosen-file"><FileTextOutlined /> {value.name} <Button type="link" size="small" onClick={() => onChange?.(undefined)}>Bỏ chọn</Button></span>}<small className="muted">Tối đa 10 MB/tệp trong DEMO. Tệp chỉ tồn tại trong phiên này.</small></div>;
}
export function ExecutionTag({ task }: { task: Task }) {
  return <Tag className="status-tag" color={task.execution === 'DA_HOAN_THANH' ? 'success' : task.execution === 'DANG_THUC_HIEN' ? 'processing' : 'default'}>{executionLabels[task.execution]}</Tag>;
}
export function DeadlineTag({ task }: { task: Task }) {
  const { data, today } = useDemo(); const b = bucket(task, data.extensions, today);
  if (!b) return <Tag className="status-tag" color={isLate(task) ? 'orange' : 'success'}>{isLate(task) ? 'Hoàn thành chậm hạn' : 'Hoàn thành đúng hạn'}</Tag>;
  return <Tag className={`status-tag deadline-${b}`} color={{ CON_HAN: 'default', NGUY_CO_CHAM: 'gold', SAP_DEN_HAN_KHAN: 'orange', QUA_HAN: 'error' }[b]}>{deadlineLabels[b]}</Tag>;
}
export function ExtensionTag({ task }: { task: Task }) {
  const { data } = useDemo(); const state = extensionState(task.id, data.extensions);
  return state === 'KHONG_XIN' ? <span className="muted">—</span> : <Tag className="status-tag" color={state === 'DANG_XIN' ? 'purple' : state === 'DA_DUOC_GIA_HAN' ? 'cyan' : 'default'}>{extensionLabels[state]}</Tag>;
}
export function DueCell({ task }: { task: Task }) {
  const { data, today } = useDemo(); const due = effectiveDue(task, data.extensions); const d = daysBetween(due, today); const b = bucket(task, data.extensions, today);
  return <div className="due-cell"><strong className={b === 'QUA_HAN' ? 'due-overdue' : b === 'SAP_DEN_HAN_KHAN' ? 'due-urgent' : b === 'NGUY_CO_CHAM' ? 'due-risk' : ''}>{fmt(due)}</strong>{task.execution !== 'DA_HOAN_THANH' && <small className={d < 0 ? 'text-red' : 'muted'}>{d < 0 ? `Quá ${-d} ngày` : d === 0 ? 'Đến hạn hôm nay' : `Còn ${d} ngày`}</small>}{due !== task.originalDue && <Tooltip title={`Hạn gốc: ${fmt(task.originalDue)}`}><small className="text-blue">Đã gia hạn</small></Tooltip>}</div>;
}
export function Panel({ title, subtitle, extra, children, className = '' }: { title?: React.ReactNode; subtitle?: string; extra?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{title && <div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{extra}</div>}{children}</section>;
}
export function EmptyTasks({ reset }: { reset?: () => void }) { return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có nhiệm vụ phù hợp">{reset && <Button onClick={reset}>Xóa bộ lọc</Button>}</Empty>; }
export function DrillButton({ count, onClick, tone = '' }: { count: number; onClick: () => void; tone?: string }) { return <button className={`count-link ${tone}`} onClick={onClick} aria-label={`Xem ${count} nhiệm vụ`}>{count}</button>; }
export function TextLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="text-link" onClick={onClick}>{children} <ArrowRightOutlined /></button>; }
