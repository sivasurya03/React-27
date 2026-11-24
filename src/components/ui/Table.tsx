import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { EmptyState } from './Feedback';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Real table from `md` up; stacked cards on mobile so nothing needs horizontal scrolling. */
export function Table<T>({ columns, rows, rowKey, emptyTitle = 'Nothing to show', emptyDescription }: TableProps<T>) {
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  const [first, ...rest] = columns;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn('px-4 py-3 font-medium', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="transition hover:bg-subtle/60">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="space-y-2 py-3">
            <div className="font-medium text-fg">{first.cell(row)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rest.map((column) => (
                <div key={column.key}>
                  <dt className="text-xs text-muted">{column.header}</dt>
                  <dd className="text-fg">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
