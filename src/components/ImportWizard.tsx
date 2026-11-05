import { useState } from 'react';
import { Alert, App, Button, Modal, Radio, Result, Select, Space, Steps, Table, Tag, Upload } from 'antd';
import { DownloadOutlined, InboxOutlined, RightOutlined } from './icons';
import templateUrl from '../../docs/product/Mau_Import_NhiemVu_UBND_HuongDo_v1_3.xlsx?url';
import { createDemo } from '../demo';
import { fmt, type Task } from '../domain';
import { downloadCsv } from '../files';
import { useDemo } from '../store';

export { templateUrl };
export function ImportWizard({ close, imported }: { close: () => void; imported: () => void }) {
  const { data, today, importDemo } = useDemo(); const { message } = App.useApp();
  const [step, setStep] = useState(0); const [scenario, setScenario] = useState('valid'); const [filename, setFilename] = useState('');
  const [strategy, setStrategy] = useState('skip'); const [count, setCount] = useState<number | null>(null); const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Task[]>([]);
  const load = () => {
    const next = Math.max(...data.tasks.map(t => Number(t.code.split('-').at(-1)) || 0));
    setRows(createDemo(today).tasks.slice(0, 3).map((t, i) => ({ ...t, id: crypto.randomUUID(), code: `NV-${today.slice(0, 4)}-${String(next + i + 1).padStart(4, '0')}`, externalRef: scenario === 'duplicate' && i === 0 ? data.tasks[0].externalRef : `IMPORT-DEMO-${i + 1}`, title: `[Import minh họa] ${t.title}`, sourceFile: undefined, resultFile: undefined, progress: [], events: [] })));
    setStep(1);
  };
  const duplicate = (t: Task) => data.tasks.some(x => x.externalRef === t.externalRef);
  const error = (index: number) => scenario === 'error' && index === 1;
  const errors = scenario === 'error' ? 1 : 0;
  const duplicates = rows.filter(duplicate).length;
  const execute = () => {
    setBusy(true);
    try {
      const selected = strategy === 'skip' ? rows.filter(t => !duplicate(t)) : rows.map(t => duplicate(t) ? { ...t, externalRef: `IMPORT-DEMO-NEW-${crypto.randomUUID()}` } : t);
      setCount(importDemo(selected)); message.success('Đã thêm nhiệm vụ vào bộ nhớ DEMO. Chưa nhập Excel thực tế.');
    } catch (e) { message.error((e as Error).message); } finally { setBusy(false); }
  };
  return <Modal open width={960} title={<div><span className="eyebrow">CÔNG CỤ NHẬP LIỆU</span><h2 className="modal-title">Import Excel · Mô phỏng giao diện</h2></div>} onCancel={close} footer={null}>
    <Alert type="info" showIcon className="mb20" message="Chặng 1 chưa đọc nội dung tệp Excel" description="Tệp được chọn chỉ hiển thị tên. Các dòng xem trước bên dưới lấy từ kịch bản DEMO đã chọn; xác nhận chỉ thêm vào bộ nhớ trình duyệt." />
    <Steps current={step} size="small" responsive={false} labelPlacement="vertical" items={[{ title: 'Chọn tệp' }, { title: 'Xem trước & kiểm tra' }, { title: 'Xác nhận & kết quả' }]} className="mb24" />
    {step === 0 && <><div className="import-template"><div><strong>Mẫu nhập nhiệm vụ V1.3</strong><p>Sheet NHAP_NHIEM_VU · Tiêu đề dòng 5 · Dữ liệu từ dòng 6 · 19 cột</p></div><Button icon={<DownloadOutlined />} href={templateUrl} download="Mau_Import_NhiemVu_UBND_HuongDo_v1_3.xlsx">Tải mẫu Excel</Button></div><Upload.Dragger accept=".xlsx" maxCount={1} showUploadList={false} beforeUpload={file => { if (!file.name.toLowerCase().endsWith('.xlsx')) { message.error('Chọn tệp .xlsx.'); return Upload.LIST_IGNORE; } setFilename(file.name); return false; }}><p className="ant-upload-drag-icon"><InboxOutlined /></p><p className="ant-upload-text">Kéo thả hoặc chọn tệp Excel</p><p className="ant-upload-hint">{filename ? `Đã chọn: ${filename} · Chưa phân tích nội dung` : 'Chọn tệp để xem cách hiển thị. Có thể thử bằng kịch bản minh họa bên dưới.'}</p></Upload.Dragger><div className="scenario-control"><label htmlFor="scenario">Kịch bản dùng thử</label><Select id="scenario" value={scenario} onChange={setScenario} options={[{ value: 'valid', label: '03 dòng hợp lệ' }, { value: 'error', label: '01 dòng sai đơn vị — chặn xác nhận' }, { value: 'duplicate', label: 'Có dòng trùng mã đối chiếu' }]} /></div><div className="wizard-footer"><Button onClick={close}>Hủy</Button><Button type="primary" onClick={load}>Xem trước kịch bản DEMO <RightOutlined /></Button></div></>}
    {step === 1 && <><div className="import-totals"><span><i className="dot green" />{rows.length - errors} dòng hợp lệ về trường</span><span><i className="dot red" />{errors} dòng cần sửa</span><span><i className="dot orange" />{duplicates} dòng trùng</span></div><Table rowKey="id" size="small" pagination={false} scroll={{ x: 720 }} dataSource={rows} columns={[
      { title: 'Dòng', width: 70, render: (_, __, i) => i + 6 }, { title: 'Mã đối chiếu', dataIndex: 'externalRef', width: 160 },
      { title: 'Nội dung nhiệm vụ', dataIndex: 'title', width: 310 }, { title: 'Hạn gốc', dataIndex: 'originalDue', width: 110, render: fmt },
      { title: 'Kiểm tra', width: 230, render: (_, t, i) => error(i) ? <span className="text-red">Dòng 7, cột I · Đơn vị chủ trì không có trong danh mục.</span> : duplicate(t) ? <Tag color="orange">Trùng mã đối chiếu</Tag> : <Tag color="success">Hợp lệ</Tag> },
    ]} />{errors > 0 && <Alert className="mt16" type="error" showIcon message="Có lỗi chặn. Chưa ghi bất kỳ nhiệm vụ nào." action={<Button size="small" onClick={() => downloadCsv('Loi_IMPORT_DEMO.csv', ['Dòng', 'Cột', 'Lỗi'], [[7, 'I - Đơn vị chủ trì', 'Không có trong danh mục (kịch bản minh họa)']])}>Tải danh sách lỗi</Button>} />}
      {duplicates > 0 && <div className="scenario-control"><label>Cách xử lý trùng</label><Radio.Group value={strategy} onChange={e => setStrategy(e.target.value)}><Space direction="vertical"><Radio value="skip">Bỏ qua dòng trùng (mặc định)</Radio><Radio value="new">Tạo nhiệm vụ mới với mã đối chiếu mới · DEMO</Radio><Radio value="update" disabled>Cập nhật bản ghi — triển khai ở Chặng 3</Radio></Space></Radio.Group></div>}
      <p className="muted mt16">Không nhập sheet VI_DU/DANH_MUC. Không tạo đôn đốc, gia hạn hoặc tệp đính kèm.</p><div className="wizard-footer"><Button onClick={() => setStep(0)}>Quay lại / đổi kịch bản</Button><Button type="primary" disabled={errors > 0} onClick={() => setStep(2)}>Tiếp tục xác nhận <RightOutlined /></Button></div></>}
    {step === 2 && (count === null ? <><div className="import-confirm"><div className="confirm-icon"><InboxOutlined /></div><h3>Xác nhận thêm dữ liệu minh họa?</h3><p>{strategy === 'skip' ? rows.length - duplicates : rows.length} nhiệm vụ sẽ được thêm vào bộ nhớ DEMO.</p><p className="muted">Tệp {filename || '(kịch bản mẫu)'} chưa được đọc. Không có dữ liệu ghi vào cơ sở dữ liệu.</p></div><div className="wizard-footer"><Button onClick={() => setStep(1)}>Quay lại</Button><Button type="primary" loading={busy} onClick={execute}>Xác nhận mô phỏng import</Button></div></> : <Result status="success" title={`Đã thêm ${count} nhiệm vụ DEMO`} subTitle="Chỉ lưu trong bộ nhớ phiên. Tải lại trang sẽ khôi phục dữ liệu ban đầu." extra={[<Button key="close" onClick={close}>Đóng</Button>, <Button key="view" type="primary" onClick={imported}>Xem nhiệm vụ vừa nhập</Button>]} />)}
  </Modal>;
}
