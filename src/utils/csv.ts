const cell = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

export const toCsv = (headers: string[], rows: (string | number)[][]): string =>
  [headers.map(cell).join(','), ...rows.map((row) => row.map(cell).join(','))].join('\n');

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const url = URL.createObjectURL(new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
