import type { ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import { useDemo } from '../store';
import { useVietnamTime } from './BusinessClock';

export function PageHeading({ title, description, dashboard, children }: { title: string; description: string; dashboard: boolean; children: ReactNode }) {
  const { role } = useDemo(); const clock = useVietnamTime();
  const greeting = clock.hour < 12 ? 'Chào buổi sáng' : clock.hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  return <section className={`page-heading ${dashboard ? 'dashboard-heading' : ''}`}>
    <div className="heading-copy">{dashboard && <span className="heading-eyebrow">{greeting}, {role === 'OFFICE' ? 'cán bộ Văn phòng' : 'Lãnh đạo'}!</span>}<h1>{title}</h1><p>{description}</p></div>
    <div className="heading-actions">{children}<span className="update-label"><CalendarDays />Ngày theo dõi: {clock.date}</span></div>
    {dashboard && <span className="heading-image-credit">Phong cảnh minh họa</span>}
  </section>;
}
