import { useEffect, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

const zone = 'Asia/Ho_Chi_Minh';
export function useVietnamTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  return {
    now,
    date: new Intl.DateTimeFormat('vi-VN', { timeZone: zone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(now),
    time: new Intl.DateTimeFormat('vi-VN', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
    weekday: new Intl.DateTimeFormat('vi-VN', { timeZone: zone, weekday: 'long' }).format(now),
    hour: Number(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).format(now)),
  };
}
export function BusinessClock({ compact = false }: { compact?: boolean }) {
  const clock = useVietnamTime();
  return <div className={`business-clock ${compact ? 'clock-compact' : ''}`} aria-label={`Giờ Việt Nam, ${clock.date}`}>
    <span className="clock-symbol"><CalendarDays size={25} /></span>
    <div className="clock-calendar"><span>{clock.weekday}</span><strong>{clock.date}</strong>{!compact && <small>Giờ Việt Nam · UTC+7</small>}</div>
    {!compact && <><i className="clock-divider" /><div className="clock-time"><Clock3 /><strong>{clock.time}</strong><small>Đồng hồ hiện tại</small></div></>}
  </div>;
}
