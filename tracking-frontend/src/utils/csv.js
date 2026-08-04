export function exportRows(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows, filename) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const body = rows.map((row) => headers.map((header) => row[header]));
  exportRows(filename, [headers, ...body]);
}


