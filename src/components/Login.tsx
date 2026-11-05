import { useState } from 'react';
import { Button, Input, Radio, Tag } from 'antd';
import { ArrowRight, Building2, CalendarClock, ChartColumnIncreasing, Check, ClipboardList, Landmark, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { BusinessClock } from './BusinessClock';
import type { DemoRole } from '../store';

export function Login({ enter }: { enter: (role: DemoRole) => void }) {
  const [role, setRole] = useState<DemoRole>('OFFICE');
  return <main className="login-page">
    <section className="login-intro" aria-label="Nhận diện UBND xã Hương Đô">
      <div className="login-brand"><span className="brand-symbol"><Landmark /></span><div><small>ỦY BAN NHÂN DÂN</small><strong>XÃ HƯƠNG ĐÔ</strong></div></div>
      <div className="login-message">
        <span className="login-eyebrow">VĂN PHÒNG HĐND – UBND</span>
        <h1>THEO DÕI &<br />ĐÔN ĐỐC<br /><span>NHIỆM VỤ</span></h1>
        <i className="login-gold-rule" />
        <p>Nắm chắc tiến độ. Rõ trách nhiệm.<br />Chủ động điều hành nhiệm vụ được giao.</p>
        <div className="login-features">
          <div><ClipboardList /><span>Quản lý<br /><b>nhiệm vụ</b></span></div>
          <div><CalendarClock /><span>Cảnh báo<br /><b>thời hạn</b></span></div>
          <div><ChartColumnIncreasing /><span>Tổng hợp<br /><b>báo cáo</b></span></div>
        </div>
      </div>
      <div className="login-landscape-caption">Phong cảnh minh họa</div>
      <BusinessClock />
    </section>
    <section className="login-right" aria-label="Đăng nhập mẫu">
      <div className="login-form">
        <div className="login-form-heading"><span className="login-app-icon"><Building2 /></span><Tag className="demo-tag">PHIÊN BẢN TRẢI NGHIỆM · DEMO</Tag><h2>Đăng nhập hệ thống</h2><p>Theo dõi và đôn đốc nhiệm vụ<br />UBND xã Hương Đô</p></div>
        <div className="login-inputs"><label htmlFor="demo-account">Tài khoản minh họa</label><Input id="demo-account" prefix={<UserRound />} value={role === 'OFFICE' ? 'vanphong.demo' : 'lanhdao.demo'} readOnly size="large" /><label htmlFor="demo-password">Mật khẩu minh họa</label><Input.Password id="demo-password" prefix={<LockKeyhole />} value="demoonly" readOnly size="large" /></div>
        <span className="login-role-label">Chọn vai trò trải nghiệm</span>
        <Radio.Group value={role} onChange={e => setRole(e.target.value)} className="login-roles">
          <Radio.Button value="OFFICE"><span className="role-icon"><ClipboardList /></span><span>Cán bộ Văn phòng<small>Cập nhật và xác nhận</small></span>{role === 'OFFICE' && <Check className="role-check" />}</Radio.Button>
          <Radio.Button value="VIEWER"><span className="role-icon"><UserRound /></span><span>Lãnh đạo<small>Theo dõi và báo cáo</small></span>{role === 'VIEWER' && <Check className="role-check" />}</Radio.Button>
        </Radio.Group>
        <Button className="login-submit" block size="large" type="primary" onClick={() => enter(role)}><span>Vào giao diện DEMO</span><ArrowRight /></Button>
        <div className="login-disclaimer"><ShieldCheck /><p>Bản DEMO chưa xác thực tài khoản. Thao tác chỉ giữ trong phiên; tải lại sẽ khôi phục dữ liệu mẫu.</p></div>
      </div>
      <footer>UBND xã Hương Đô <span>·</span> Văn phòng HĐND – UBND</footer>
    </section>
  </main>;
}
