import { useState } from 'react';
import { Alert, App, Button, DatePicker, Dropdown, Input, Modal, Popconfirm, Select, Skeleton, Space, Switch, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowDownOutlined, ArrowRightOutlined, BarChartOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseOutlined, DownloadOutlined, ExclamationCircleOutlined, FileTextOutlined, FilterOutlined, ImportOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, SendOutlined, SettingOutlined, WarningOutlined } from './components/icons';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { ArrowUpRight, CalendarClock, Ellipsis, Eye, Layers3, UsersRound } from 'lucide-react';
import dayjs from 'dayjs';
import { leaders, sources, units } from './demo';
import { bucket, deadlineLabels, effectiveDue, executionLabels, expediteCount, extensionLabels, extensionState, fmt, prioritySort, stats, type DemoData, type Filters, type Task } from './domain';
import { downloadCsv } from './files';
import { useDemo } from './store';
import { DeadlineTag, DrillButton, DueCell, EmptyTasks, ExecutionTag, ExtensionTag, Panel, TextLink } from './components/shared';
import type { FormAction } from './components/TaskForms';
import { templateUrl } from './components/ImportWizard';

export type Drill = (extra: Partial<Filters>) => void;
export interface PageProps { tasks: Task[]; filters: Filters; changeFilter: (f: Filters) => void; drill: Drill; open: (id: string) => void; action: (a: FormAction) => void; importOpen: () => void }
const opts = (values: { id: string; name: string }[]) => values.map(v => ({ value: v.id, label: v.name }));
export function FilterBar({ filters: f, changeFilter, page }: Pick<PageProps, 'filters' | 'changeFilter'> & { page: string }) {
  const [advanced, setAdvanced] = useState(false); const { data, today } = useDemo();
  const set = (key: keyof Filters, value?: string) => changeFilter({ ...f, [key]: value || undefined });
  const active = Object.values(f).filter(Boolean).length;
  const select = (key: keyof Filters, label: string, options: { value: string; label: string }[], className = '') => <div className={`filter-field ${className}`}><label htmlFor={`filter-${key}`}>{label}</label><Select id={`filter-${key}`} aria-label={label} allowClear showSearch optionFilterProp="label" placeholder={key === 'year' ? 'Tất cả' : `Tất cả ${label.toLowerCase()}`} value={f[key]} onChange={v => set(key, v)} options={options} /></div>;
  return <div className="filter-panel">
    <div className="filter-main"><div className="filter-field search-filter"><label htmlFor="filter-search">Tìm kiếm nhiệm vụ</label><Input id="filter-search" value={f.search || ''} onChange={e => set('search', e.target.value)} allowClear prefix={<SearchOutlined />} placeholder="Mã, nội dung, số văn bản…" /></div>
      {select('year', 'Năm', [...new Set([today.slice(0, 4), ...data.tasks.map(t => t.assigned.slice(0, 4))])].sort().reverse().map(y => ({ value: y, label: y })), 'year-filter')}
      {select('source', 'Nguồn nhiệm vụ', opts(sources))}{select('unit', 'Đơn vị chủ trì', opts(units))}{select('leader', 'Lãnh đạo chỉ đạo', opts(leaders))}
      <div className="filter-actions"><Button icon={<FilterOutlined />} onClick={() => setAdvanced(!advanced)} type={advanced ? 'primary' : 'default'} ghost={advanced}>{advanced ? 'Thu gọn' : 'Lọc thêm'}{active ? ` (${active})` : ''}</Button><Tooltip title="Xóa tất cả bộ lọc"><Button aria-label="Xóa bộ lọc" icon={<ReloadOutlined />} onClick={() => changeFilter({})} /></Tooltip></div>
    </div>
    {advanced && <div className="filter-advanced">
      {select('execution', 'Thực hiện', [{ value: 'PENDING', label: 'Tất cả chưa hoàn thành' }, ...Object.entries(executionLabels).map(([value, label]) => ({ value, label })), { value: 'LATE', label: 'Hoàn thành chậm hạn' }])}
      {select('deadline', 'Tình trạng hạn', Object.entries(deadlineLabels).map(([value, label]) => ({ value, label })))}
      {select('extension', 'Gia hạn', Object.entries(extensionLabels).map(([value, label]) => ({ value, label })))}
      {select('priority', 'Ưu tiên', [{ value: 'NORMAL', label: 'Bình thường' }, { value: 'HIGH', label: 'Ưu tiên cao' }, { value: 'URGENT', label: 'Khẩn' }])}
      {select('coordinator', 'Đơn vị phối hợp', opts(units))}
      {select('expedited', 'Đôn đốc', [{ value: 'yes', label: 'Đã có văn bản' }, { value: 'no', label: 'Chưa có văn bản' }])}
      <div className="filter-field range-filter"><label>Ngày giao từ – đến</label><DatePicker.RangePicker aria-label="Khoảng ngày giao" format="DD/MM/YYYY" value={f.from && f.to ? [dayjs(f.from), dayjs(f.to)] : null} onChange={v => changeFilter({ ...f, from: v?.[0]?.format('YYYY-MM-DD'), to: v?.[1]?.format('YYYY-MM-DD') })} /></div>
    </div>}
    {active > 0 && <div className="filter-chips"><span>Đang lọc:</span>{Object.entries(f).filter(([, v]) => !!v).map(([k, v]) => {
      const names: Record<string, string> = { search: 'Từ khóa', year: 'Năm', source: 'Nguồn', unit: 'Chủ trì', leader: 'Lãnh đạo', execution: 'Thực hiện', deadline: 'Hạn', extension: 'Gia hạn', from: 'Từ', to: 'Đến', coordinator: 'Phối hợp', priority: 'Ưu tiên', expedited: 'Đôn đốc' };
      const display = (k === 'unit' || k === 'coordinator' ? units : k === 'source' ? sources : k === 'leader' ? leaders : []).find(x => x.id === v)?.name || ({ ...executionLabels, ...deadlineLabels, ...extensionLabels, PENDING: 'Chưa hoàn thành', LATE: 'Hoàn thành chậm', yes: 'Đã có', no: 'Chưa có', HIGH: 'Cao', NORMAL: 'Bình thường', URGENT: 'Khẩn' } as Record<string, string>)[v as string] || v;
      return <Tag key={k} closable onClose={e => { e.preventDefault(); const next = { ...f }; delete next[k as keyof Filters]; changeFilter(next); }}>{names[k]}: {display}</Tag>;
    })}<button className="clear-filter" onClick={() => changeFilter({})}>Xóa tất cả</button></div>}
    <div className="filter-footnote"><CalendarOutlined /> Kỳ thống kê theo ngày giao{page === 'expedite' ? ' · Chỉ hiển thị nhiệm vụ chưa hoàn thành có cảnh báo hạn' : ''}</div>
  </div>;
}

const kpis = [
  { key: 'total', label: 'Tổng nhiệm vụ', hint: 'Theo bộ lọc hiện tại', icon: Layers3, tone: 'blue', extra: {} },
  { key: 'completed', label: 'Đã hoàn thành', hint: 'Văn phòng đã xác nhận', icon: CheckCircleOutlined, tone: 'green', extra: { execution: 'DA_HOAN_THANH' } },
  { key: 'pending', label: 'Chưa hoàn thành', hint: 'Chưa làm & đang thực hiện', icon: ClockCircleOutlined, tone: 'teal', extra: { execution: 'PENDING' } },
  { key: 'risk', label: 'Nguy cơ chậm', hint: 'Còn 3–5 ngày', icon: WarningOutlined, tone: 'gold', extra: { deadline: 'NGUY_CO_CHAM' } },
  { key: 'urgent', label: 'Sắp đến hạn', hint: 'Còn 0–2 ngày · Khẩn', icon: CalendarClock, tone: 'orange', extra: { deadline: 'SAP_DEN_HAN_KHAN' } },
  { key: 'overdue', label: 'Quá hạn', hint: 'Cần ưu tiên đôn đốc', icon: ExclamationCircleOutlined, tone: 'red', extra: { deadline: 'QUA_HAN' } },
] as const;
const percent = (part: number, total: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(total ? part * 100 / total : 0);
export function KpiCards({ tasks, drill }: Pick<PageProps, 'tasks' | 'drill'>) {
  const { data, today } = useDemo(); const s = stats(tasks, data, today);
  return <div className="kpi-grid">{kpis.map(k => <button key={k.key} className={`kpi-card tone-${k.tone}`} onClick={() => drill(k.extra)} data-testid={`kpi-${k.key}`}>
    <span className="kpi-icon"><k.icon /></span><div className="kpi-copy"><span className="kpi-label">{k.label}</span><strong>{s[k.key]}</strong>
    <span className="kpi-hint">{k.key === 'completed' ? `Đạt ${percent(s.completed, s.total)}%` : k.key === 'pending' ? `Còn lại ${percent(s.pending, s.total)}%` : k.hint}</span></div><span className="kpi-arrow"><ArrowRightOutlined /></span>
  </button>)}</div>;
}
function exportTasks(tasks: Task[], data: DemoData) {
  downloadCsv('NhiemVu_HuongDo_DEMO.csv', ['Mã', 'Nội dung', 'Nguồn', 'Chủ trì', 'Lãnh đạo', 'Ngày giao', 'Hạn gốc', 'Hạn hiệu lực', 'Thực hiện', 'Số đôn đốc'], tasks.map(t => [t.code, t.title, sources.find(s => s.id === t.source)?.name, units.find(u => u.id === t.unit)?.name, leaders.find(l => l.id === t.leader)?.name, fmt(t.assigned), fmt(t.originalDue), fmt(effectiveDue(t, data.extensions)), executionLabels[t.execution], expediteCount(t.id, data.expedites)]));
}
export function TaskTable({ tasks, open, action, compact = false, select, selected, reset }: { tasks: Task[]; open: (id: string) => void; action: (a: FormAction) => void; compact?: boolean; select?: (ids: string[]) => void; selected?: string[]; reset?: () => void }) {
  const { data, today, role } = useDemo();
  const columns: ColumnsType<Task> = [
    { title: 'NỘI DUNG NHIỆM VỤ', key: 'title', width: compact ? 300 : 360, render: (_, t) => <div className="task-name"><button onClick={() => open(t.id)}>{t.title}</button><span><span className="task-code">{t.code}</span>{!compact && <span className="task-source">{sources.find(s => s.id === t.source)?.name}</span>}</span></div> },
    { title: 'ĐƠN VỊ CHỦ TRÌ', dataIndex: 'unit', width: compact ? 170 : 190, render: (id, t) => <div><span className="unit-name">{units.find(u => u.id === id)?.name}</span>{!compact && <small className="unit-leader">{leaders.find(l => l.id === t.leader)?.name}</small>}</div> },
    ...(!compact ? [{ title: 'LÃNH ĐẠO', dataIndex: 'leader', width: 155, responsive: ['xxl' as const], render: (id: string) => leaders.find(l => l.id === id)?.name }] : []),
    { title: 'HẠN HIỆU LỰC', key: 'due', width: compact ? 130 : 145, sorter: (a, b) => effectiveDue(a, data.extensions).localeCompare(effectiveDue(b, data.extensions)), render: (_, t) => <DueCell task={t} /> },
    { title: compact ? 'CẢNH BÁO' : 'THỰC HIỆN / THỜI HẠN', key: 'status', width: compact ? 150 : 195, render: (_, t) => <div className="status-stack">{!compact && <ExecutionTag task={t} />}<DeadlineTag task={t} />{!compact && extensionState(t.id, data.extensions) !== 'KHONG_XIN' && <span className="inline-extension"><ExtensionTag task={t} /></span>}</div> },
    ...(!compact ? [{ title: 'ĐÔN ĐỐC', key: 'expedites', width: 100, render: (_: unknown, t: Task) => <button className="expedite-count" onClick={() => open(t.id)}><SendOutlined /> {expediteCount(t.id, data.expedites)} lần</button> }, { title: 'GIA HẠN', key: 'extension', width: 180, responsive: ['xxl' as const], render: (_: unknown, t: Task) => <ExtensionTag task={t} /> }] : []),
    { title: 'THAO TÁC', key: 'actions', fixed: 'right', width: compact ? 112 : 138, render: (_, t) => <div className="row-actions"><Tooltip title="Xem chi tiết"><Button aria-label={`Xem chi tiết ${t.code}`} icon={<Eye />} onClick={() => open(t.id)} /></Tooltip>{role === 'OFFICE' && <Tooltip title="Ghi nhận đôn đốc"><Button aria-label={`Ghi nhận đôn đốc ${t.code}`} icon={<SendOutlined />} onClick={() => action({ kind: 'expedite', taskIds: [t.id] })} /></Tooltip>}<Dropdown menu={{ items: [
      { key: 'view', label: 'Xem chi tiết', onClick: () => open(t.id) },
      ...(role === 'OFFICE' ? [{ key: 'edit', label: 'Chỉnh sửa', onClick: () => action({ kind: 'task', taskId: t.id }) },
        ...(t.execution !== 'DA_HOAN_THANH' ? [{ key: 'progress', label: 'Cập nhật tiến độ', onClick: () => action({ kind: 'progress', taskId: t.id }) }, { key: 'extension', label: 'Đề nghị gia hạn', disabled: extensionState(t.id, data.extensions) === 'DANG_XIN', onClick: () => action({ kind: 'extension', taskId: t.id }) }, { key: 'complete', label: 'Xác nhận hoàn thành', onClick: () => action({ kind: 'complete', taskId: t.id }) }] : []),
        { key: 'expedite', label: 'Ghi nhận đôn đốc', onClick: () => action({ kind: 'expedite', taskIds: [t.id] }) }] : []),
    ] }} trigger={['click']}><Button aria-label={`Thao tác ${t.code}`} className="row-menu" icon={<Ellipsis />} /></Dropdown></div> },
  ];
  return <Table rowKey="id" columns={columns} dataSource={prioritySort(tasks, data, today)} pagination={compact ? false : { defaultPageSize: 10, pageSizeOptions: [10, 20, 50], showSizeChanger: true, showTotal: n => `${n} nhiệm vụ` }} scroll={{ x: compact ? 900 : 1280 }} locale={{ emptyText: <EmptyTasks reset={reset} /> }} rowSelection={select ? { selectedRowKeys: selected, onChange: keys => select(keys.map(String)), preserveSelectedRowKeys: false } : undefined} />;
}
export function UnitTable({ tasks, drill, compact = false }: Pick<PageProps, 'tasks' | 'drill'> & { compact?: boolean }) {
  const { data, today } = useDemo(); const rows = units.map(u => ({ ...u, ...stats(tasks.filter(t => t.unit === u.id), data, today) }));
  const cols: ColumnsType<typeof rows[number]> = [{ title: 'ĐƠN VỊ CHỦ TRÌ', dataIndex: 'name', width: 240, fixed: 'left', render: (name, row) => <button className="unit-link" onClick={() => drill({ unit: row.id })}>{name}</button> }];
  const fields: { key: keyof ReturnType<typeof stats>; title: string; extra: Filters; tone?: string }[] = [
    { key: 'total', title: 'Tổng', extra: {} }, { key: 'completed', title: 'Hoàn thành', extra: { execution: 'DA_HOAN_THANH' } },
    { key: 'late', title: 'HT chậm', extra: { execution: 'LATE' } }, { key: 'pending', title: 'Chưa xong', extra: { execution: 'PENDING' } },
    { key: 'risk', title: 'Nguy cơ', extra: { deadline: 'NGUY_CO_CHAM' }, tone: 'gold' }, { key: 'urgent', title: 'Khẩn', extra: { deadline: 'SAP_DEN_HAN_KHAN' }, tone: 'orange' },
    { key: 'overdue', title: 'Quá hạn', extra: { deadline: 'QUA_HAN' }, tone: 'red' }, { key: 'requesting', title: 'Đang xin GH', extra: { extension: 'DANG_XIN' }, tone: 'purple' },
  ];
  const shown = compact ? fields.filter(f => ['total', 'completed', 'pending', 'overdue'].includes(f.key)) : fields;
  shown.forEach(f => cols.push({ title: f.title, key: f.key, width: f.key === 'requesting' ? 120 : 95, align: 'center', render: (_, row) => <DrillButton count={row[f.key]} tone={f.tone} onClick={() => drill({ ...f.extra, unit: row.id })} /> }));
  if (compact) cols.push({ title: 'TỶ LỆ HOÀN THÀNH', key: 'rate', width: 165, render: (_, row) => <button className="completion-rate" aria-label={`Hoàn thành ${row.name}: ${percent(row.completed, row.total)}%`} onClick={() => drill({ unit: row.id, execution: 'DA_HOAN_THANH' })}><span><i style={{ width: `${row.total ? row.completed * 100 / row.total : 0}%` }} /></span><b>{percent(row.completed, row.total)}%</b></button> });
  const total = stats(tasks, data, today);
  return <Table className="unit-table" rowKey="id" columns={cols} dataSource={rows} pagination={false} scroll={{ x: compact ? 820 : 1120 }} summary={() => <Table.Summary.Row><Table.Summary.Cell index={0}><strong>Tổng toàn xã</strong></Table.Summary.Cell>{shown.map((f, i) => <Table.Summary.Cell index={i + 1} key={f.key} align="center"><strong>{total[f.key]}</strong></Table.Summary.Cell>)}{compact && <Table.Summary.Cell index={shown.length + 1}><b>{percent(total.completed, total.total)}%</b></Table.Summary.Cell>}</Table.Summary.Row>} />;
}

export function Dashboard(props: PageProps) {
  const { data, today } = useDemo(); const s = stats(props.tasks, data, today);
  const attention = prioritySort(props.tasks.filter(t => { const b = bucket(t, data.extensions, today); return b && b !== 'CON_HAN'; }), data, today);
  const inProgress = props.tasks.filter(t => t.execution === 'DANG_THUC_HIEN').length;
  const notStarted = props.tasks.filter(t => t.execution === 'CHUA_THUC_HIEN').length;
  const chart = [
    { name: 'Đã hoàn thành', value: s.completed, color: '#16A34A', state: 'DA_HOAN_THANH' },
    { name: 'Đang thực hiện', value: inProgress, color: '#0891B2', state: 'DANG_THUC_HIEN' },
    { name: 'Chưa thực hiện', value: notStarted, color: '#BFD3E8', state: 'CHUA_THUC_HIEN' },
  ];
  const focusUnits = units.map(u => ({ ...u, ...stats(props.tasks.filter(t => t.unit === u.id), data, today) }))
    .filter(u => u.overdue + u.urgent + u.risk > 0)
    .sort((a, b) => b.overdue - a.overdue || b.urgent - a.urgent || b.risk - a.risk || a.id.localeCompare(b.id)).slice(0, 3);
  return <>
    <KpiCards tasks={props.tasks} drill={props.drill} />
    <div className="secondary-kpis">
      <button onClick={() => props.drill({ extension: 'DANG_XIN' })}><ClockCircleOutlined />Đang xin gia hạn <b>{s.requesting}</b><ArrowRightOutlined /></button>
      <button onClick={() => props.drill({ expedited: 'yes' })}><SendOutlined />Nhiệm vụ đã đôn đốc <b>{s.expedited}</b><ArrowRightOutlined /></button>
      <span className="secondary-note">Một nhiệm vụ · Một đơn vị chủ trì · Không đếm trùng</span>
    </div>
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <Panel className="attention-panel" title={<><span className="section-accent orange" />Cần theo dõi hôm nay <Tag>{attention.length}</Tag></>}
          subtitle="Ưu tiên quá hạn → khẩn → nguy cơ chậm"
          extra={<TextLink onClick={() => props.drill({ execution: 'PENDING' })}>Xem tất cả</TextLink>}>
          <TaskTable tasks={attention.slice(0, 4)} open={props.open} action={props.action} compact />
          <div className="panel-bottom"><span><i className="dot red" />{s.overdue} quá hạn</span><span><i className="dot orange" />{s.urgent} sắp đến hạn</span><span><i className="dot gold" />{s.risk} nguy cơ chậm</span></div>
        </Panel>
        <Panel title={<><BarChartOutlined />Thống kê theo 11 đơn vị</>} subtitle="Thống kê theo đơn vị chủ trì · Bấm số liệu để tra cứu"
          extra={<TextLink onClick={() => props.drill({})}>Xem chi tiết</TextLink>}>
          <UnitTable tasks={props.tasks} drill={props.drill} compact />
        </Panel>
      </div>
      <aside className="dashboard-side" aria-label="Phân tích tình hình nhiệm vụ">
        <Panel title={<><BarChartOutlined />Tình hình thực hiện</>} subtitle={`Theo bộ lọc · ${s.total} nhiệm vụ`} className="chart-panel">
          <div className="donut-layout"><div className="donut-wrap"><ResponsiveContainer width="100%" height={176}>
            <PieChart><Pie data={s.total ? chart : [{ name: 'Chưa có dữ liệu', value: 1, color: '#E8EFF6' }]} dataKey="value" innerRadius={57} outerRadius={75} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
              {(s.total ? chart : [{ color: '#E8EFF6' }]).map((c, i) => <Cell key={i} fill={c.color} />)}
            </Pie>{s.total > 0 && <ChartTooltip />}</PieChart>
          </ResponsiveContainer><div className="donut-center"><strong>{percent(s.completed, s.total)}<small>%</small></strong><span>Đã hoàn thành</span></div></div>
          <div className="chart-legend">{chart.map(c => <button key={c.state} onClick={() => props.drill({ execution: c.state })}><i style={{ background: c.color }} /><span>{c.name}<b>{c.value} <small>({percent(c.value, s.total)}%)</small></b></span></button>)}</div></div>
          <p className="chart-footnote">Nguy cơ, khẩn và quá hạn là các nhóm con của nhiệm vụ chưa hoàn thành.</p>
        </Panel>
        <Panel title={<><UsersRound />Đơn vị cần chú ý</>} subtitle="Ưu tiên đơn vị có nhiệm vụ quá hạn">
          <div className="focus-units">{focusUnits.length ? focusUnits.map((u, i) => <button key={u.id} onClick={() => props.drill({ unit: u.id, deadline: u.overdue ? 'QUA_HAN' : u.urgent ? 'SAP_DEN_HAN_KHAN' : 'NGUY_CO_CHAM' })}><span className={`focus-rank rank-${i}`}>{i + 1}</span><span><strong>{u.name}</strong><small>{[u.overdue && `${u.overdue} quá hạn`, u.urgent && `${u.urgent} sắp đến hạn`, u.risk && `${u.risk} nguy cơ`].filter(Boolean).join(' · ')}</small></span><ArrowUpRight /></button>) : <p className="no-attention">Không có đơn vị cần cảnh báo theo bộ lọc.</p>}</div>
        </Panel>
        <Panel title={<><Layers3 />Nguồn nhiệm vụ</>} subtitle="Cơ cấu trong bộ lọc hiện tại">
          <div className="source-breakdown">{sources.map((source, i) => {
            const count = props.tasks.filter(t => t.source === source.id).length;
            return <button key={source.id} onClick={() => props.drill({ source: source.id })}><div><span>{source.name}</span><b>{count}</b></div><div className={`source-meter source-${i}`}><i style={{ width: `${s.total ? count * 100 / s.total : 0}%` }} /></div><small>{percent(count, s.total)}% tổng nhiệm vụ</small></button>;
          })}</div>
        </Panel>
      </aside>
    </div>
  </>;
}

export function TasksPage(props: PageProps) {
  const { data } = useDemo();
  return <Panel title={<>Danh sách nhiệm vụ <Tag>{props.tasks.length} nhiệm vụ</Tag></>} subtitle="Bấm vào nội dung để xem hồ sơ và lịch sử xử lý" extra={<Button icon={<DownloadOutlined />} onClick={() => exportTasks(props.tasks, data)}>Xuất CSV · DEMO</Button>}><TaskTable tasks={props.tasks} open={props.open} action={props.action} reset={() => props.changeFilter({})} /></Panel>;
}
export function ExpeditePage(props: PageProps) {
  const { data, today, role } = useDemo(); const [selected, setSelected] = useState<string[]>([]);
  const attention = props.tasks.filter(t => { const b = bucket(t, data.extensions, today); return b && b !== 'CON_HAN'; });
  const eligible = selected.filter(id => attention.some(t => t.id === id));
  return <><div className="expedite-banner"><div className="expedite-banner-icon"><SendOutlined /></div><div><h2>Chủ động đôn đốc, theo sát tiến độ</h2><p>Chọn các nhiệm vụ để ghi nhận chung một văn bản. Cảnh báo hạn không tự gửi văn bản ra ngoài.</p></div></div><Panel title={<>Nhiệm vụ cần đôn đốc <Tag color="orange">{attention.length}</Tag></>} subtitle="Các nhiệm vụ chưa hoàn thành đang quá hạn, khẩn hoặc có nguy cơ chậm" extra={role === 'OFFICE' && <Button aria-label={`Đôn đốc đã chọn${eligible.length ? ` (${eligible.length})` : ''}`} type="primary" disabled={!eligible.length} icon={<SendOutlined />} onClick={() => props.action({ kind: 'expedite', taskIds: eligible })}>Đôn đốc đã chọn {eligible.length ? `(${eligible.length})` : ''}</Button>}>
    {eligible.length > 0 && <div className="selection-bar"><span>Đã chọn <b>{eligible.length}</b> nhiệm vụ · Một văn bản được lưu chung cho các nhiệm vụ này</span><Button type="link" onClick={() => setSelected([])}>Bỏ chọn</Button></div>}
    <TaskTable tasks={attention} open={props.open} action={props.action} select={role === 'OFFICE' ? setSelected : undefined} selected={eligible} reset={() => props.changeFilter({})} /></Panel><p className="page-note">Số lần đôn đốc được đếm theo văn bản hợp lệ, không tăng khi chỉ mở form hoặc sửa văn bản.</p></>;
}
export function ReportsPage(props: PageProps) {
  const { data, today } = useDemo(); const s = stats(props.tasks, data, today);
  const exportSummary = () => downloadCsv('TongHop_11DonVi_HuongDo_DEMO.csv', ['Đơn vị', 'Tổng', 'Hoàn thành', 'HT chậm', 'Chưa hoàn thành', 'Nguy cơ', 'Khẩn', 'Quá hạn', 'Đang xin gia hạn'], units.map(u => { const x = stats(props.tasks.filter(t => t.unit === u.id), data, today); return [u.name, x.total, x.completed, x.late, x.pending, x.risk, x.urgent, x.overdue, x.requesting]; }));
  return <><div className="report-strip"><div><small>Tổng nhiệm vụ</small><strong>{s.total}</strong></div><div><small>Tỷ lệ hoàn thành</small><strong className="text-green">{percent(s.completed, s.total)}%</strong></div><div><small>Quá hạn chưa xong</small><strong className="text-red">{s.overdue}</strong></div><div><small>Ngày tham chiếu</small><strong className="date-value">{fmt(today)}</strong></div></div><Panel title="Báo cáo tổng hợp theo 11 đơn vị" subtitle="Bấm vào số liệu để mở đúng danh sách nhiệm vụ" extra={<Dropdown menu={{ items: [{ key: 'summary', label: 'Tổng hợp 11 đơn vị · CSV DEMO', onClick: exportSummary }, { key: 'detail', label: 'Chi tiết nhiệm vụ đã lọc · CSV DEMO', onClick: () => exportTasks(props.tasks, data) }] }}><Button icon={<DownloadOutlined />}>Xuất báo cáo <ArrowDownOutlined /></Button></Dropdown>}><UnitTable tasks={props.tasks} drill={props.drill} /></Panel><Alert className="mt20" type="info" showIcon message="Cách đọc báo cáo" description="Hoàn thành chậm thuộc Đã hoàn thành; Nguy cơ, Khẩn, Quá hạn thuộc Chưa hoàn thành. Đang xin gia hạn có thể trùng các nhóm này. Đơn vị phối hợp không được cộng vào tổng. Chặng 1 xuất CSV; workbook báo cáo Excel sẽ triển khai cùng dữ liệu thật." /></>;
}
export function CatalogPage() {
  const { role, reset, data } = useDemo(); const { message } = App.useApp(); const [loading, setLoading] = useState(false); const [error, setError] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  return <><div className="catalog-grid"><Panel title="Đơn vị được giao nhiệm vụ" subtitle="Danh mục chuẩn · 11 đơn vị"><Table size="middle" rowKey="id" pagination={false} scroll={{ x: 500 }} dataSource={units} columns={[{ title: 'MÃ', dataIndex: 'id', width: 85 }, { title: 'TÊN ĐƠN VỊ', dataIndex: 'name' }, { title: 'TRẠNG THÁI', width: 120, render: () => <Tag color="success">Đang sử dụng</Tag> }]} /></Panel><div className="catalog-side"><Panel title="Lãnh đạo chỉ đạo" subtitle="Danh mục chỉ đạo, không phải tài khoản">{leaders.map((l, i) => <div key={l.id} className="leader-row"><span className={`leader-avatar avatar-${i}`}>{l.name.split(' ').slice(-2).map(s => s[0]).join('')}</span><div><strong>{l.name}</strong><small>{l.title}</small></div><span className="muted">{l.id}</span></div>)}</Panel><Panel title="Nguồn nhiệm vụ"><div className="source-list">{sources.map((s, i) => <div key={s.id}><span className="source-icon"><FileTextOutlined /></span><div><strong>{s.name}</strong><small>Nguồn 0{i + 1}</small></div><Tag color="blue">Cố định</Tag></div>)}</div></Panel></div></div>
    <Panel className="mt20" title={<><SettingOutlined /> Cấu hình và công cụ xem thử</>} subtitle="Thay đổi dưới đây chỉ mô phỏng trong phiên, không lưu cấu hình thật."><div className="config-body"><div className="config-row"><div><strong>Cảnh báo thời hạn</strong><p>Ngày lịch theo giờ Việt Nam · Nguy cơ 3–5 ngày · Khẩn 0–2 ngày · Quá hạn từ ngày kế tiếp</p></div><Tag>Quy tắc MVP V1.3</Tag></div><div className="config-row"><div><strong>Gợi ý xác nhận trước khi rời biểu mẫu</strong><p>Điều khiển minh họa để duyệt cách trình bày cấu hình; chưa áp dụng hành vi.</p></div><Switch aria-label="Cấu hình minh họa" checked={enabled.confirm ?? true} onChange={v => { setEnabled({ ...enabled, confirm: v }); message.info('Đã đổi công tắc minh họa trong phiên; chưa áp dụng nghiệp vụ.'); }} disabled={role === 'VIEWER'} /></div><div className="config-row"><div><strong>Bộ dữ liệu dùng thử</strong><p>{data.tasks.length} nhiệm vụ trong bộ nhớ · Tải lại trang hoặc khôi phục để trở về bộ mẫu</p></div><Popconfirm title="Khôi phục dữ liệu DEMO?" description="Các thay đổi trong phiên sẽ được thay bằng bộ mẫu ban đầu." onConfirm={() => { reset(); message.success('Đã khôi phục bộ mẫu.'); }} okText="Khôi phục" cancelText="Hủy"><Button icon={<ReloadOutlined />} disabled={role === 'VIEWER'}>Khôi phục DEMO</Button></Popconfirm></div><div className="config-row"><div><strong>Trạng thái giao diện</strong><p>Dùng để duyệt cách hiển thị khi đang tải hoặc có lỗi. Không gọi API.</p></div><Space wrap><Button onClick={() => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 1500); }}>Xem trạng thái tải</Button><Button onClick={() => setError(true)}>Xem lỗi & thử lại</Button></Space></div>{loading && <Skeleton active paragraph={{ rows: 2 }} />}{error && <Alert type="error" showIcon message="Không thể tải dữ liệu · Tình huống mô phỏng" description="Ứng dụng thật sẽ hiển thị lỗi thay vì thay số liệu thành 0." action={<Button onClick={() => { setError(false); message.success('Đã thoát tình huống lỗi minh họa.'); }}>Thử lại</Button>} />}</div></Panel>
    <Alert type="warning" showIcon className="mt20" message="Tài khoản, phân quyền và cấu hình thật chưa triển khai" description="Chặng 1 chỉ có hai vai trò xem thử. Chưa có API, cơ sở dữ liệu, lưu trữ file hoặc xác thực thật." />
  </>;
}

export function PageToolbar({ page, action, importOpen }: Pick<PageProps, 'action' | 'importOpen'> & { page: string }) {
  const { role } = useDemo();
  if (role !== 'OFFICE' || page === 'catalog') return null;
  return <Space wrap>{page === 'tasks' && <><Button icon={<DownloadOutlined />} href={templateUrl} download="Mau_Import_NhiemVu_UBND_HuongDo_v1_3.xlsx">Tải mẫu</Button><Button aria-label="Import Excel" icon={<ImportOutlined />} onClick={importOpen}>Import Excel</Button></>}<Button aria-label="Thêm nhiệm vụ" type="primary" icon={<PlusOutlined />} onClick={() => action({ kind: 'task' })}>Thêm nhiệm vụ</Button></Space>;
}
