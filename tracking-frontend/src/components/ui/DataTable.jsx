import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, LoadingState } from './Primitives';

export function DataTable({ columns, rows, renderRow, loading, emptyTitle = 'No data', emptyText = 'No rows match the current view.', pageText }) {
  if (loading) {
    return <LoadingState />;
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <div className="table-wrap">
      <div className="pagination-row">
        <span className="showing-count">{pageText || `Showing 1-${rows.length} of ${rows.length}`}</span>
        <button type="button" className="icon-btn" aria-label="Previous page"><ChevronLeft size={16} /></button>
        <button type="button" className="icon-btn" aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.employeeId ?? row.employeeCode ?? row.detectedAt ?? row.applicationName ?? index}>
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
