import { useEffect, useState } from 'react';
import { Alert, App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { leaders, sources, units } from '../demo';
import { addDays, daysBetween, effectiveDue, executionLabels, fmt, type Expedite, type Extension, type Task } from '../domain';
import { useDemo } from '../store';
import { FileField } from './shared';

export type FormAction = { kind: 'task'; taskId?: string } | { kind: 'progress' | 'complete' | 'extension'; taskId: string } | { kind: 'expedite'; taskIds: string[]; editId?: string } | { kind: 'resolve'; extensionId: string };
const required = [{ required: true, message: 'Vui lòng nhập hoặc chọn trường này.' }];
const options = (list: { id: string; name: string }[]) => list.map(x => ({ value: x.id, label: x.name }));
const dateKeys = ['assigned', 'originalDue', 'docDate', 'date', 'sentDate', 'responseDue', 'proposedDue', 'responseDate', 'approvedDue', 'completedDate'];

export function TaskForms({ action, close, saved }: { action: FormAction; close: () => void; saved: (taskId?: string) => void }) {
  const store = useDemo(); const { data, today } = store; const { message } = App.useApp();
  const [form] = Form.useForm(); const [busy, setBusy] = useState(false);
  const task = 'taskId' in action ? data.tasks.find(t => t.id === action.taskId) : undefined;
  const req = action.kind === 'resolve' ? data.extensions.find(e => e.id === action.extensionId) : undefined;
  const subject = task || data.tasks.find(t => t.id === req?.taskId);
  const due = subject ? effectiveDue(subject, data.extensions) : today;
  const watchedUnit = Form.useWatch('unit', form);
  const state = Form.useWatch('state', form);
  const proposal = Form.useWatch('proposedDue', form);
  const values = () => {
    const initial: Record<string, unknown> = action.kind === 'task' ? (task ? { ...task } : { assigned: today, originalDue: addDays(today, 7), execution: 'CHUA_THUC_HIEN', priority: 'NORMAL', coordinators: [] })
      : action.kind === 'expedite' ? { taskIds: action.taskIds, date: today, issuer: 'Văn phòng HĐND - UBND', ...data.expedites.find(d => d.id === action.editId) }
      : action.kind === 'extension' ? { date: today, unit: task?.unit, proposedDue: addDays(due, 7) }
      : action.kind === 'resolve' ? { state: 'DA_DUOC_GIA_HAN', responseDate: today, approvedDue: req?.proposedDue }
      : action.kind === 'complete' ? { completedDate: today }
      : { date: today, percent: task?.percent };
    dateKeys.forEach(k => { if (typeof initial[k] === 'string') initial[k] = dayjs(initial[k] as string); }); return initial;
  };
  useEffect(() => { form.resetFields(); form.setFieldsValue(values()); }, [action]); // Fresh form per action; data updates do not overwrite typing.
  const title = action.kind === 'task' ? task ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới' : action.kind === 'expedite' ? action.editId ? 'Sửa văn bản đôn đốc' : 'Ghi nhận văn bản đôn đốc' : action.kind === 'extension' ? 'Thêm đề nghị gia hạn' : action.kind === 'resolve' ? 'Ghi nhận kết quả xem xét' : action.kind === 'complete' ? 'Xác nhận hoàn thành' : 'Cập nhật tiến độ';
  const submit = async (keepOpen = false) => {
    let v;
    try { v = await form.validateFields(); } catch { return; }
    setBusy(true);
    try {
      const converted: Record<string, unknown> = { ...v };
      dateKeys.forEach(k => { if (dayjs.isDayjs(converted[k])) converted[k] = (converted[k] as dayjs.Dayjs).format('YYYY-MM-DD'); });
      let taskId = task?.id;
      if (action.kind === 'task') taskId = store.saveTask(converted as Partial<Task>, action.taskId);
      if (action.kind === 'progress') store.saveProgress(action.taskId, converted as unknown as Parameters<typeof store.saveProgress>[1]);
      if (action.kind === 'complete') store.complete(action.taskId, converted.completedDate as string, converted.result as string, converted.resultFile as Task['resultFile']);
      if (action.kind === 'expedite') store.saveExpedite(converted as unknown as Omit<Expedite, 'id'>, action.editId);
      if (action.kind === 'extension') store.requestExtension({ ...converted, taskId: action.taskId } as unknown as Parameters<typeof store.requestExtension>[0]);
      if (action.kind === 'resolve') store.resolveExtension(action.extensionId, converted as Partial<Extension>);
      message.success('Đã cập nhật dữ liệu DEMO trong bộ nhớ. Chưa lưu vào cơ sở dữ liệu.');
      if (keepOpen && action.kind === 'task' && !task) { form.resetFields(); form.setFieldsValue({ assigned: dayjs(today), originalDue: dayjs(addDays(today, 7)), priority: 'NORMAL', execution: 'CHUA_THUC_HIEN' }); }
      else { saved(taskId); close(); }
    } catch (error) { message.error((error as Error).message); } finally { setBusy(false); }
  };
  const date = (name: string, label: string, isRequired = true, extra?: React.ReactNode) => <Form.Item name={name} label={label} rules={isRequired ? required : []} extra={extra}><DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} /></Form.Item>;
  const unitSelect = <Select showSearch optionFilterProp="label" options={options(units)} placeholder="Chọn đơn vị" />;
  return <Modal open title={<div><span className="eyebrow">THAO TÁC MINH HỌA</span><h2 className="modal-title">{title}</h2></div>} onCancel={close} width={action.kind === 'task' || action.kind === 'expedite' ? 820 : 680}
    footer={<Space wrap><Button onClick={close}>Hủy</Button>{action.kind === 'task' && !task && <Button loading={busy} onClick={() => void submit(true)}>Lưu & thêm tiếp</Button>}<Button type="primary" loading={busy} onClick={() => void submit()}>{action.kind === 'complete' ? 'Xác nhận hoàn thành · DEMO' : 'Lưu minh họa'}</Button></Space>} destroyOnClose>
    <Alert className="form-demo-alert" type="info" showIcon message="Chỉ mô phỏng trên bộ nhớ phiên. Tải lại trang sẽ khôi phục dữ liệu mẫu." />
    {subject && <div className="form-subject"><span>{subject.code}</span><strong>{subject.title}</strong></div>}
    {(action.kind === 'extension' || action.kind === 'resolve') && subject && <><div className="due-summary"><div><small>Hạn gốc</small><b>{fmt(subject.originalDue)}</b></div><div><small>Hạn hiệu lực</small><b>{fmt(due)}</b></div><div><small>{action.kind === 'resolve' ? 'Hạn đề nghị' : 'Số ngày xin thêm'}</small><b>{action.kind === 'resolve' ? fmt(req?.proposedDue) : proposal ? `${daysBetween(proposal.format('YYYY-MM-DD'), due)} ngày` : '—'}</b></div></div><Alert type="warning" showIcon message={action.kind === 'extension' ? 'Lưu đề nghị chưa làm thay đổi hạn cảnh báo.' : 'Chỉ ghi nhận chấp thuận khi đã có văn bản của người/cơ quan có thẩm quyền.'} className="mb16" /></>}
    <Form form={form} layout="vertical" requiredMark onFinish={() => void submit()} scrollToFirstError>
      {action.kind === 'task' && <>
        <div className="form-section-title">01 <span>Nguồn và văn bản căn cứ</span></div>
        <div className="form-grid"><Form.Item name="source" label="Nguồn nhiệm vụ" rules={required}><Select options={options(sources)} placeholder="Chọn nguồn" /></Form.Item><Form.Item name="externalRef" label="Mã đối chiếu"><Input placeholder="Tùy chọn, duy nhất nếu có" /></Form.Item>
          <Form.Item name="docNo" label="Số/ký hiệu văn bản"><Input placeholder="Không bắt buộc với kết luận miệng" /></Form.Item>{date('docDate', 'Ngày văn bản', false)}
          <Form.Item name="issuer" label="Cơ quan ban hành"><Input placeholder="Nhập cơ quan ban hành" /></Form.Item><Form.Item name="summary" label="Trích yếu / Tên cuộc họp"><Input placeholder="Mô tả ngắn căn cứ giao" /></Form.Item>
          <Form.Item className="full" name="sourceFile" label="Tệp căn cứ"><FileField /></Form.Item></div>
        <div className="form-section-title">02 <span>Nội dung và phân công</span></div>
        <Form.Item name="title" label="Nội dung nhiệm vụ" rules={[...required, { whitespace: true, message: 'Nội dung không được chỉ có khoảng trắng.' }]}><Input.TextArea rows={3} placeholder="Mô tả cụ thể đầu việc cần theo dõi…" maxLength={2000} showCount /></Form.Item>
        <div className="form-grid"><Form.Item name="unit" label="Đơn vị chủ trì" rules={required}>{unitSelect}</Form.Item><Form.Item name="leader" label="Lãnh đạo chỉ đạo" rules={required}><Select options={options(leaders)} placeholder="Chọn lãnh đạo" /></Form.Item>
          <Form.Item className="full" name="coordinators" label="Đơn vị phối hợp" rules={[{ validator: (_, v) => v?.includes(watchedUnit) ? Promise.reject(new Error('Không chọn trùng đơn vị chủ trì.')) : Promise.resolve() }]}><Select mode="multiple" options={options(units.filter(u => u.id !== watchedUnit))} placeholder="Có thể chọn nhiều đơn vị" optionFilterProp="label" /></Form.Item>
          <Form.Item name="field" label="Lĩnh vực"><Input placeholder="Ví dụ: Kinh tế, Tổng hợp" /></Form.Item><Form.Item name="owner" label="Người theo dõi Văn phòng"><Input placeholder="Họ tên cán bộ theo dõi" /></Form.Item></div>
        <div className="form-section-title">03 <span>Thời hạn và tiến độ</span></div>
        <div className="form-grid">{date('assigned', 'Ngày giao')}
          <Form.Item name="originalDue" label="Hạn hoàn thành gốc" dependencies={['assigned']} extra={task ? 'Hạn gốc bất biến. Gia hạn được ghi tại tab Gia hạn.' : undefined} rules={[...required, { validator: (_, v) => v && form.getFieldValue('assigned') && v.isBefore(form.getFieldValue('assigned'), 'day') ? Promise.reject(new Error('Hạn gốc không được trước ngày giao.')) : Promise.resolve() }]}><DatePicker format="DD/MM/YYYY" disabled={!!task} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="priority" label="Mức ưu tiên"><Select options={[{ value: 'NORMAL', label: 'Bình thường' }, { value: 'HIGH', label: 'Ưu tiên cao' }, { value: 'URGENT', label: 'Khẩn' }]} /></Form.Item>
          <Form.Item name="execution" label="Trạng thái thực hiện" rules={required} extra="Hoàn thành được xác nhận bằng thao tác riêng."><Select disabled={task?.execution === 'DA_HOAN_THANH'} options={Object.entries(executionLabels).filter(([key]) => key !== 'DA_HOAN_THANH' || task?.execution === 'DA_HOAN_THANH').map(([value, label]) => ({ value, label }))} /></Form.Item>
          <Form.Item name="note" label="Ghi chú" className="full"><Input.TextArea rows={2} placeholder="Thông tin bổ sung" /></Form.Item></div>
      </>}
      {action.kind === 'expedite' && <><Form.Item name="taskIds" label="Nhiệm vụ được đôn đốc" rules={required}><Select mode="multiple" optionFilterProp="label" options={data.tasks.map(t => ({ value: t.id, label: `${t.code} · ${t.title}` }))} /></Form.Item><div className="form-grid"><Form.Item name="number" label="Số/ký hiệu văn bản" rules={required}><Input placeholder="Ví dụ minh họa: DEMO-04/VP" /></Form.Item>{date('date', 'Ngày ban hành')}{date('sentDate', 'Ngày gửi', false)}<Form.Item name="issuer" label="Cơ quan ban hành"><Input /></Form.Item><Form.Item name="signer" label="Người ký"><Input placeholder="Người ký văn bản" /></Form.Item>{date('responseDue', 'Hạn yêu cầu báo cáo', false)}</div><Form.Item name="summary" label="Trích yếu"><Input /></Form.Item><Form.Item name="text" label="Nội dung yêu cầu đôn đốc" rules={required}><Input.TextArea rows={3} placeholder="Nội dung yêu cầu đơn vị thực hiện hoặc báo cáo" /></Form.Item><Form.Item name="file" label="Tệp văn bản" rules={required}><FileField /></Form.Item></>}
      {action.kind === 'extension' && <><div className="form-grid"><Form.Item name="number" label="Số văn bản đề nghị" rules={required}><Input placeholder="Số/ký hiệu văn bản xin gia hạn" /></Form.Item>{date('date', 'Ngày đề nghị')}<Form.Item name="unit" label="Đơn vị đề nghị" rules={required}>{unitSelect}</Form.Item><Form.Item name="proposedDue" label="Hạn đề nghị mới" rules={[...required, { validator: (_, v) => v && v.format('YYYY-MM-DD') <= due ? Promise.reject(new Error('Phải sau hạn hiệu lực hiện tại.')) : Promise.resolve() }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item></div><Form.Item name="reason" label="Lý do xin gia hạn" rules={required}><Input.TextArea rows={3} placeholder="Nêu lý do và nội dung cần thêm thời gian" /></Form.Item><Form.Item name="file" label="Văn bản đề nghị đính kèm" rules={required}><FileField /></Form.Item></>}
      {action.kind === 'resolve' && <><Form.Item name="state" label="Kết quả xem xét" rules={required}><Select options={[{ value: 'DA_DUOC_GIA_HAN', label: 'Chấp thuận' }, { value: 'KHONG_DUOC_CHAP_THUAN', label: 'Không chấp thuận' }]} /></Form.Item><div className="form-grid"><Form.Item name="responseNo" label="Số văn bản phản hồi" rules={required}><Input /></Form.Item>{date('responseDate', 'Ngày phản hồi')}<Form.Item name="responseIssuer" label="Người/cơ quan có thẩm quyền"><Input /></Form.Item>{state === 'DA_DUOC_GIA_HAN' && <Form.Item name="approvedDue" label="Hạn được chấp thuận" rules={[...required, { validator: (_, v) => v && v.format('YYYY-MM-DD') <= due ? Promise.reject(new Error('Phải sau hạn hiệu lực hiện tại.')) : Promise.resolve() }]} extra="Có thể khác hạn đề nghị."><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>}</div><Form.Item name="responseFile" label="Văn bản phản hồi đính kèm" rules={required}><FileField /></Form.Item></>}
      {action.kind === 'progress' && <>{date('date', 'Ngày cập nhật')}<Form.Item name="text" label="Nội dung thực hiện" rules={required}><Input.TextArea rows={4} placeholder="Tình hình thực hiện, công việc đã xử lý…" /></Form.Item><Form.Item name="percent" label="Tiến độ (%)" extra="Tùy chọn. 100% không tự xác nhận hoàn thành."><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item><Form.Item name="difficulty" label="Khó khăn, vướng mắc"><Input.TextArea rows={2} /></Form.Item><Form.Item name="file" label="Minh chứng"><FileField /></Form.Item></>}
      {action.kind === 'complete' && <>{date('completedDate', 'Ngày hoàn thành thực tế', true, 'Ngày thực tế có thể khác ngày xác nhận; không được trong tương lai.')}<Form.Item name="result" label="Nội dung kết quả" rules={[...required, { whitespace: true, message: 'Vui lòng mô tả kết quả.' }]}><Input.TextArea rows={4} placeholder="Kết quả đã kiểm tra và xác nhận" /></Form.Item><Form.Item name="resultFile" label="Tài liệu minh chứng"><FileField /></Form.Item><Alert showIcon type="info" message={`Hạn đối chiếu hoàn thành: ${fmt(due)}`} description="Hạn này được chụp lại khi xác nhận; không thay đổi phân loại kết quả theo các cập nhật hạn về sau." /></>}
    </Form>
  </Modal>;
}
