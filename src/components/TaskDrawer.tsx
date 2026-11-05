import { Alert, Button, Descriptions, Drawer, Empty, Progress, Space, Tabs, Tag, Timeline } from 'antd';
import { CheckCircleOutlined, EditOutlined, FileTextOutlined, PlusOutlined, SendOutlined } from './icons';
import { leaders, sources, units } from '../demo';
import { effectiveDue, expediteCount, extensionLabels, extensionState, fmt } from '../domain';
import { useDemo } from '../store';
import { DeadlineTag, ExecutionTag, ExtensionTag, FileLink } from './shared';
import type { FormAction } from './TaskForms';

export function TaskDrawer({ taskId, close, action }: { taskId: string; close: () => void; action: (a: FormAction) => void }) {
  const { data, role } = useDemo(); const task = data.tasks.find(t => t.id === taskId);
  if (!task) return null;
  const canWrite = role === 'OFFICE'; const unfinished = task.execution !== 'DA_HOAN_THANH';
  const exts = data.extensions.filter(e => e.taskId === task.id).sort((a, b) => b.sequence - a.sequence);
  const docs = data.expedites.filter(d => d.taskIds.includes(task.id)).sort((a, b) => a.date.localeCompare(b.date));
  const info = [
    { key: 'source', label: 'Nguồn nhiệm vụ', children: sources.find(s => s.id === task.source)?.name },
    { key: 'priority', label: 'Mức ưu tiên', children: { NORMAL: 'Bình thường', HIGH: 'Ưu tiên cao', URGENT: 'Khẩn' }[task.priority] },
    { key: 'unit', label: 'Đơn vị chủ trì', span: 2, children: <strong>{units.find(u => u.id === task.unit)?.name}</strong> },
    { key: 'coordinators', label: 'Phối hợp', span: 2, children: task.coordinators.length ? task.coordinators.map(id => units.find(u => u.id === id)?.name).join('; ') : 'Không có' },
    { key: 'leader', label: 'Lãnh đạo chỉ đạo', children: leaders.find(l => l.id === task.leader)?.name },
    { key: 'owner', label: 'Người theo dõi', children: task.owner || 'Chưa chỉ định' },
    { key: 'assigned', label: 'Ngày giao', children: fmt(task.assigned) },
    { key: 'originalDue', label: 'Hạn gốc', children: fmt(task.originalDue) },
    { key: 'due', label: 'Hạn hiệu lực', children: <strong>{fmt(effectiveDue(task, data.extensions))}</strong> },
    { key: 'doc', label: 'Số văn bản', children: task.docNo || 'Chưa có số' },
    { key: 'summary', label: 'Trích yếu / Kết luận', span: 2, children: task.summary || 'Chưa bổ sung' },
    { key: 'issuer', label: 'Cơ quan ban hành', children: task.issuer || '—' },
    { key: 'docDate', label: 'Ngày văn bản', children: fmt(task.docDate) },
    { key: 'file', label: 'Tệp căn cứ', span: 2, children: <FileLink file={task.sourceFile} /> },
    { key: 'notes', label: 'Ghi chú', span: 2, children: task.note || 'Không có ghi chú' },
  ];
  return <Drawer open width={860} onClose={close} className="task-drawer" title={<div><span className="eyebrow">HỒ SƠ NHIỆM VỤ</span><div className="drawer-code">{task.code}</div></div>} extra={canWrite && <Button aria-label="Chỉnh sửa" icon={<EditOutlined />} onClick={() => action({ kind: 'task', taskId })}>Chỉnh sửa</Button>}>
    <h2 className="drawer-title">{task.title}</h2><Space wrap className="mb20"><ExecutionTag task={task} /><DeadlineTag task={task} /><ExtensionTag task={task} /></Space>
    <Tabs defaultActiveKey="info" items={[
      { key: 'info', label: 'Thông tin', children: <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" items={info} /> },
      { key: 'progress', label: 'Tiến độ', children: <>
        <div className="progress-summary"><div><span className="muted">Tiến độ được ghi nhận</span><strong>{task.percent ?? 0}%</strong></div><Progress percent={task.percent || 0} strokeColor="#1682c4" /><small className="muted">100% chưa đồng nghĩa với đã xác nhận hoàn thành.</small></div>
        {canWrite && unfinished && <Space wrap className="mb20"><Button aria-label="Cập nhật tiến độ" icon={<PlusOutlined />} onClick={() => action({ kind: 'progress', taskId })}>Cập nhật tiến độ</Button><Button aria-label="Xác nhận hoàn thành" type="primary" icon={<CheckCircleOutlined />} onClick={() => action({ kind: 'complete', taskId })}>Xác nhận hoàn thành</Button></Space>}
        {!unfinished && <div className="completion-box"><h3><CheckCircleOutlined /> Kết quả đã xác nhận · DEMO</h3><p>Ngày hoàn thành thực tế: <b>{fmt(task.completedDate)}</b></p><p>Hạn tại thời điểm xác nhận: <b>{fmt(task.completionDue)}</b></p><p>{task.result}</p><FileLink file={task.resultFile} /></div>}
        {task.progress.length ? <Timeline items={[...task.progress].reverse().map(p => ({ color: '#1682c4', children: <div className="timeline-item"><small>{fmt(p.date)} · Văn phòng (DEMO)</small><strong>{p.text}</strong>{p.percent !== undefined && <Tag>{p.percent}%</Tag>}{p.difficulty && <p>Vướng mắc: {p.difficulty}</p>}{p.file && <FileLink file={p.file} />}</div> }))} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có cập nhật tiến độ" />}
      </> },
      { key: 'expedite', label: `Đôn đốc (${expediteCount(taskId, data.expedites)})`, children: <><div className="tab-toolbar"><div><h3>Sổ văn bản đôn đốc</h3><p className="muted">Mỗi văn bản hợp lệ liên kết nhiệm vụ được tính một lần.</p></div>{canWrite && <Button type="primary" icon={<SendOutlined />} onClick={() => action({ kind: 'expedite', taskIds: [taskId] })}>Ghi nhận đôn đốc</Button>}</div>{docs.length ? docs.map((d, i) => <article className="record-card" key={d.id}><div className="record-top"><span className="record-index">{String(i + 1).padStart(2, '0')}</span><div><h4>{d.number}</h4><small>{fmt(d.date)} · {d.issuer}</small></div>{canWrite && <Button aria-label="Sửa" size="small" icon={<EditOutlined />} onClick={() => action({ kind: 'expedite', taskIds: d.taskIds, editId: d.id })}>Sửa</Button>}</div><p>{d.text}</p><FileLink file={d.file} />{d.taskIds.length > 1 && <small className="muted block">Văn bản dùng chung cho {d.taskIds.length} nhiệm vụ.</small>}</article>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa ghi nhận văn bản đôn đốc" />}</> },
      { key: 'extension', label: 'Gia hạn', children: <>
        <div className="due-summary"><div><small>Hạn gốc</small><b>{fmt(task.originalDue)}</b></div><div><small>Hạn hiệu lực</small><b>{fmt(effectiveDue(task, data.extensions))}</b></div><div><small>Tình trạng</small><ExtensionTag task={task} /></div></div>
        {extensionState(taskId, data.extensions) === 'DANG_XIN' && <Alert type="warning" showIcon className="mb16" message="Đang xin gia hạn — vẫn tính theo hạn hiện tại" description="Nhiệm vụ quá hạn tiếp tục thuộc nhóm quá hạn cho đến khi có chấp thuận hợp lệ." />}
        {canWrite && unfinished && <Button aria-label="Thêm đề nghị gia hạn" className="mb20" type="primary" icon={<PlusOutlined />} disabled={extensionState(taskId, data.extensions) === 'DANG_XIN'} onClick={() => action({ kind: 'extension', taskId })}>Thêm đề nghị gia hạn</Button>}
        {exts.length ? exts.map(e => <article className="record-card" key={e.id}><div className="record-top"><span className="record-index">{String(e.sequence).padStart(2, '0')}</span><div><h4>{e.number}</h4><small>{fmt(e.date)} · {units.find(u => u.id === e.unit)?.name}</small></div><Tag color={e.state === 'DANG_XIN' ? 'purple' : e.state === 'DA_DUOC_GIA_HAN' ? 'cyan' : 'default'}>{extensionLabels[e.state]}</Tag></div><p>{e.reason}</p><div className="record-dates"><span>Hạn trước: <b>{fmt(e.previousDue)}</b></span><span>Hạn xin: <b>{fmt(e.proposedDue)}</b></span>{e.approvedDue && <span>Được duyệt: <b className="text-green">{fmt(e.approvedDue)}</b></span>}</div><p><FileTextOutlined /> Đề nghị: <FileLink file={e.file} /></p>{e.responseNo && <><p>Văn bản phản hồi: <b>{e.responseNo}</b> · {fmt(e.responseDate)}</p><FileLink file={e.responseFile} /></>}{canWrite && unfinished && e.state === 'DANG_XIN' && <Button block className="mt12" onClick={() => action({ kind: 'resolve', extensionId: e.id })}>Ghi nhận kết quả xem xét</Button>}</article>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đề nghị gia hạn" />}
      </> },
      { key: 'history', label: 'Lịch sử', children: <><Alert type="info" showIcon className="mb20" message="Nhật ký DEMO trong bộ nhớ, chưa phải audit log lưu bền vững." /><Timeline items={[...task.events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).map(e => ({ color: '#1682c4', children: <div className="timeline-item"><small>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(e.at))} · {e.actor}</small><strong>{e.title}</strong><p>{e.detail}</p></div> }))} /></> },
    ]} />
    <div className="drawer-demo-note">DỮ LIỆU MINH HỌA · Chỉ dùng để duyệt giao diện Chặng 1</div>
  </Drawer>;
}
