import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Popover, Tag, Tooltip } from 'antd';
import { AppstoreOutlined, ArrowRightOutlined, BankOutlined, BarChartOutlined, BellOutlined, CalendarOutlined, DownOutlined, FileTextOutlined, LogoutOutlined, SendOutlined, SettingOutlined } from './components/icons';
import { bucket, filterTasks, fmt, prioritySort, stats, type Filters } from './domain';
import { DemoProvider, useDemo } from './store';
import { Login } from './components/Login';
import { PageHeading } from './components/PageHeading';
import { CatalogPage, Dashboard, ExpeditePage, FilterBar, PageToolbar, ReportsPage, TasksPage, type PageProps } from './pages';
import { TaskDrawer } from './components/TaskDrawer';
import { TaskForms, type FormAction } from './components/TaskForms';
import { ImportWizard } from './components/ImportWizard';

const pages = [
  { id: 'dashboard', path: '/tong-quan', label: 'Tổng quan', title: 'Tổng quan và cảnh báo', description: 'Theo sát tiến độ, chủ động đôn đốc nhiệm vụ được giao.', icon: AppstoreOutlined },
  { id: 'tasks', path: '/nhiem-vu', label: 'Nhiệm vụ', title: 'Quản lý nhiệm vụ', description: 'Tập trung đầu việc, rõ trách nhiệm, kiểm soát thời hạn.', icon: FileTextOutlined },
  { id: 'expedite', path: '/can-don-doc', label: 'Cần đôn đốc', title: 'Nhiệm vụ cần đôn đốc', description: 'Ưu tiên những nhiệm vụ cần quan tâm và theo dõi sát.', icon: SendOutlined },
  { id: 'reports', path: '/bao-cao', label: 'Báo cáo đơn vị', title: 'Báo cáo tổng hợp theo đơn vị', description: 'Một góc nhìn thống nhất về kết quả của 11 đơn vị.', icon: BarChartOutlined },
  { id: 'catalog', path: '/danh-muc', label: 'Danh mục', title: 'Danh mục và cấu hình', description: 'Thông tin dùng chung cho công tác theo dõi nhiệm vụ.', icon: SettingOutlined },
];
function Workspace() {
  const { data, today, role, setRole } = useDemo();
  const [signedIn, setSignedIn] = useState(false); const [params, setParams] = useSearchParams(); const location = useLocation(); const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(); const [action, setAction] = useState<FormAction>(); const [importOpen, setImportOpen] = useState(false);
  const page = pages.find(p => p.path === location.pathname) || pages[0];
  const filters = Object.fromEntries(params.entries()) as Filters;
  const tasks = filterTasks(data, filters, today); const allStats = stats(data.tasks, data, today);
  const attention = prioritySort(data.tasks.filter(t => { const b = bucket(t, data.extensions, today); return b && b !== 'CON_HAN'; }), data, today);
  const setFilters = (f: Filters) => setParams(Object.fromEntries(Object.entries(f).filter(([, v]) => !!v)) as Record<string, string>, { replace: true });
  const drill = (extra: Partial<Filters>) => {
    const query = new URLSearchParams(Object.fromEntries(Object.entries({ ...filters, ...extra }).filter(([, v]) => !!v)) as Record<string, string>);
    navigate(`/nhiem-vu?${query.toString()}`);
  };
  const pageProps: PageProps = { tasks, filters, changeFilter: setFilters, drill, open: setSelected, action: setAction, importOpen: () => setImportOpen(true) };
  if (!signedIn) return <Login enter={r => { setRole(r); setSignedIn(true); navigate('/tong-quan'); }} />;
  return <div className="application">
    <header className="app-header"><div className="header-inner"><button className="app-brand" onClick={() => navigate('/tong-quan')} aria-label="Về trang tổng quan"><span className="brand-symbol"><BankOutlined /></span><span><strong>UBND XÃ HƯƠNG ĐÔ</strong><small>THEO DÕI & ĐÔN ĐỐC NHIỆM VỤ</small></span></button><div className="header-right"><span className="header-date"><CalendarIcon />{fmt(today)}</span><Tag className="header-demo">DEMO</Tag><Popover trigger="click" placement="bottomRight" title="Cần theo dõi hôm nay" content={<div className="notification-list"><p className="muted">Cảnh báo minh họa theo thời hạn. Không tự gửi văn bản.</p>{attention.slice(0, 4).map(t => <button key={t.id} onClick={() => setSelected(t.id)}><span className="dot orange" /><span><strong>{t.title}</strong><small>{t.code}</small></span><ArrowRightOutlined /></button>)}{!attention.length && <p>Không có nhiệm vụ cần cảnh báo.</p>}</div>}><Badge count={attention.length} size="small" offset={[-4, 3]}><Button type="text" className="notification-button" aria-label="Xem cảnh báo" icon={<BellOutlined />} /></Badge></Popover><div className="header-divider" /><Dropdown trigger={['click']} menu={{ items: [{ key: 'office', label: 'Xem thử: Cán bộ Văn phòng', onClick: () => setRole('OFFICE') }, { key: 'viewer', label: 'Xem thử: Lãnh đạo chỉ xem', onClick: () => { setRole('VIEWER'); setAction(undefined); setImportOpen(false); } }, { type: 'divider' }, { key: 'logout', label: 'Thoát phiên DEMO', icon: <LogoutOutlined />, onClick: () => { setSignedIn(false); setSelected(undefined); setAction(undefined); setImportOpen(false); navigate('/dang-nhap'); } }] }}><button className="account-button"><Avatar size={34}>{role === 'OFFICE' ? 'VP' : 'LĐ'}</Avatar><span><strong>{role === 'OFFICE' ? 'Cán bộ Văn phòng' : 'Lãnh đạo'}</strong><small>Vai trò xem thử</small></span><DownOutlined /></button></Dropdown></div></div></header>
    <nav className="main-nav" aria-label="Điều hướng chính"><div className="nav-inner">{pages.map(p => <button key={p.id} aria-label={p.label} className={page.id === p.id ? 'active' : ''} aria-current={page.id === p.id ? 'page' : undefined} onClick={() => navigate(`${p.path}${p.id !== 'catalog' ? location.search : ''}`)}><p.icon /><span>{p.label}</span>{p.id === 'expedite' && allStats.overdue > 0 && <span className="nav-count">{allStats.overdue}</span>}</button>)}<span className="nav-office">Văn phòng HĐND – UBND</span></div></nav>
    <main className="main-content"><div className="breadcrumb"><span>Không gian làm việc</span><span>/</span><strong>{page.label}</strong></div><PageHeading title={page.title} description={page.description} dashboard={page.id === 'dashboard'}><PageToolbar page={page.id} action={setAction} importOpen={() => setImportOpen(true)} /></PageHeading>
      <div className="demo-banner"><span><i className="demo-status-dot" /><b>DỮ LIỆU MINH HỌA</b><span className="demo-banner-detail">Thay đổi chỉ giữ trong phiên, khôi phục khi tải lại.</span></span><Tooltip title="Vai trò chỉ để duyệt giao diện, chưa phải phân quyền bảo mật"><span className="demo-mode">{role === 'OFFICE' ? 'Chế độ nhập liệu' : 'Chế độ chỉ xem'}</span></Tooltip></div>
      {page.id !== 'catalog' && <FilterBar filters={filters} changeFilter={setFilters} page={page.id} />}
      {page.id === 'dashboard' && <Dashboard {...pageProps} />}{page.id === 'tasks' && <TasksPage {...pageProps} />}{page.id === 'expedite' && <ExpeditePage {...pageProps} />}{page.id === 'reports' && <ReportsPage {...pageProps} />}{page.id === 'catalog' && <CatalogPage />}
      <footer className="app-footer"><span>UBND xã Hương Đô <i>·</i> Theo dõi tiến độ, chủ động đôn đốc</span><span>UI MOCK V1.3 <i>·</i> Giờ Việt Nam (UTC+7)</span></footer>
    </main>
    {selected && <TaskDrawer key={selected} taskId={selected} close={() => setSelected(undefined)} action={setAction} />}
    {action && role === 'OFFICE' && <TaskForms key={JSON.stringify(action)} action={action} close={() => setAction(undefined)} saved={id => { if (id) setSelected(id); }} />}
    {importOpen && role === 'OFFICE' && <ImportWizard close={() => setImportOpen(false)} imported={() => { setImportOpen(false); drill({ search: 'IMPORT-DEMO', source: undefined, unit: undefined, leader: undefined, execution: undefined, deadline: undefined, extension: undefined, coordinator: undefined, priority: undefined, expedited: undefined, from: undefined, to: undefined, year: undefined }); }} />}
  </div>;
}
function CalendarIcon() { return <CalendarOutlined />; }
export default function App() { return <DemoProvider><Workspace /></DemoProvider>; }
