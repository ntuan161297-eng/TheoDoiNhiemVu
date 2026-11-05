import type { FileRef } from './domain';

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadFile(file: FileRef) {
  if (file.url) { const a = document.createElement('a'); a.href = file.url; a.download = file.name; a.click(); }
  else downloadBlob(new Blob(['DỮ LIỆU MINHỌA — UBND XÃ HƯƠNG ĐÔ\n\nĐây là tài liệu thử nghiệm cho giao diện Chặng 1. Không phải văn bản thực tế. Chưa có kho lưu trữ hoặc cơ sở dữ liệu.'], { type: 'text/plain;charset=utf-8' }), file.name);
}
export function downloadCsv(name: string, headers: string[], rows: unknown[][]) {
  const safe = (v: unknown) => {
    let text = String(v ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  downloadBlob(new Blob(['\uFEFF', [headers, ...rows].map(row => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), name);
}
