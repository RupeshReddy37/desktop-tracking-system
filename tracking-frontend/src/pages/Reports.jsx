import { useEffect, useMemo, useState } from 'react';
import { Download, BarChart3, PieChart, List } from 'lucide-react';
import { getDailySummary, getApplicationUsage, getDailyWindowUsage } from '../services/endpoints';
import { formatCompactDuration, safeText } from '../lib/format';
import { REPORT_TABS, REPORT_MODES, REPORT_GROUP_OPTIONS } from '../constants/navigation';
import { groupReportRows, employeeName, initialsFor } from '../utils/aggregate';
import { rangeForReport, todayDate } from '../utils/date';
import { downloadCsv } from '../utils/csv';
import { SelectControl, ActionButton, EmptyState, ErrorBanner, Panel, KpiCard } from '../components/ui/Primitives';
import { DataTable } from '../components/ui/DataTable';
import { ReportChart } from '../components/charts/Charts';

const CATEGORY_FILTER_OPTIONS = [
  { id: 'all', label: 'All categories' },
  { id: 'Productive', label: 'Productive' },
  { id: 'Neutral', label: 'Neutral' },
  { id: 'Unproductive', label: 'Unproductive' },
  { id: 'Uncategorized', label: 'Uncategorized' }
];

export function ReportsPage({ selectedDate, onToast }) {
  const [tab, setTab] = useState('daily');
  const [mode, setMode] = useState('bar');
  const [groupBy, setGroupBy] = useState('day');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = { ...rangeForReport(groupBy), page: 0, size: 500 };
      let data;
      if (tab === 'daily') data = await getDailySummary(params);
      else if (tab === 'apps') data = await getApplicationUsage(params);
      else data = await getDailyWindowUsage(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
      setError(`Report unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tab, groupBy]);

  const chartRows = useMemo(() => groupReportRows(rows, tab, groupBy), [rows, tab, groupBy]);

  const categorySummary = useMemo(() => {
    const buckets = { Productive: 0, Neutral: 0, Unproductive: 0, Uncategorized: 0 };
    rows.forEach((row) => {
      const category = row.category || 'Uncategorized';
      const seconds = Number(row.activeSeconds || row.active || 0);
      if (buckets[category] !== undefined) buckets[category] += seconds;
      else buckets.Uncategorized += seconds;
    });
    const total = Object.values(buckets).reduce((sum, value) => sum + value, 0);
    return { buckets, total };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (tab !== 'apps' || categoryFilter === 'all') return rows;
    return rows.filter((row) => (row.category || 'Uncategorized') === categoryFilter);
  }, [rows, tab, categoryFilter]);

  function exportCsv() {
    if (!rows.length) {
      onToast('Nothing to export yet.');
      return;
    }
    downloadCsv(rows, `report-${tab}-${todayDate()}.csv`);
    onToast('Report exported as CSV.');
  }

  return (
    <div className="reports-page">
      <div className="tab-bar">
        {REPORT_TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={`tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <SelectControl label="Group by" value={groupBy} onChange={setGroupBy} options={REPORT_GROUP_OPTIONS} />
        {tab === 'apps' ? (
          <SelectControl label="Category" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORY_FILTER_OPTIONS} />
        ) : null}
        <div className="segmented">
          <button type="button" className={mode === 'bar' ? 'active' : ''} onClick={() => setMode('bar')}><BarChart3 size={15} />Bar</button>
          <button type="button" className={mode === 'pie' ? 'active' : ''} onClick={() => setMode('pie')}><PieChart size={15} />Pie</button>
          <button type="button" className={mode === 'table' ? 'active' : ''} onClick={() => setMode('table')}><List size={15} />Table</button>
        </div>
        <ActionButton icon={Download} onClick={exportCsv}>Export CSV</ActionButton>
      </div>

      <ErrorBanner message={error} />

      {tab === 'apps' ? (
        <section className="kpi-grid four">
          <KpiCard label="Productive" value={formatCompactDuration(categorySummary.buckets.Productive)} detail={`${categorySummary.total ? Math.round((categorySummary.buckets.Productive / categorySummary.total) * 100) : 0}% of tracked`} tone="green" percentValue={categorySummary.total ? (categorySummary.buckets.Productive / categorySummary.total) * 100 : 0} />
          <KpiCard label="Neutral" value={formatCompactDuration(categorySummary.buckets.Neutral)} detail={`${categorySummary.total ? Math.round((categorySummary.buckets.Neutral / categorySummary.total) * 100) : 0}% of tracked`} tone="amber" percentValue={categorySummary.total ? (categorySummary.buckets.Neutral / categorySummary.total) * 100 : 0} />
          <KpiCard label="Unproductive" value={formatCompactDuration(categorySummary.buckets.Unproductive)} detail={`${categorySummary.total ? Math.round((categorySummary.buckets.Unproductive / categorySummary.total) * 100) : 0}% of tracked`} tone="red" percentValue={categorySummary.total ? (categorySummary.buckets.Unproductive / categorySummary.total) * 100 : 0} />
          <KpiCard label="Uncategorized" value={formatCompactDuration(categorySummary.buckets.Uncategorized)} detail={`${categorySummary.total ? Math.round((categorySummary.buckets.Uncategorized / categorySummary.total) * 100) : 0}% of tracked`} tone="blue" percentValue={categorySummary.total ? (categorySummary.buckets.Uncategorized / categorySummary.total) * 100 : 0} />
        </section>
      ) : null}

      {mode !== 'table' ? (
        <Panel title={REPORT_TABS.find((item) => item.id === tab)?.label} subtitle="Active vs idle time by selected grouping.">
          <ReportChart rows={chartRows} mode={mode} />
        </Panel>
      ) : null}

      {mode === 'table' || mode === 'bar' ? (
        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>Report rows</h2>
            </div>
          </div>
          <DataTable
            columns={['Employee', 'Category', 'Active', 'Idle', 'Locked', 'Offline']}
            rows={filteredRows}
            loading={loading}
            emptyTitle="No report rows"
            emptyText="No usage rows were returned for this range."

            renderRow={(row) => (
              <>
                <td>
                  <div className="person-cell">
                    <span>{initialsFor(row)}</span>
                    <b>{employeeName(row)}</b>
                  </div>
                </td>
                <td>{row.category ? <span className="category-badge">{row.category}</span> : '—'}</td>
                <td>{formatCompactDuration(row.activeSeconds || row.active || 0)}</td>
                <td>{formatCompactDuration(row.idleSeconds || row.idle || 0)}</td>
                <td>{formatCompactDuration(row.lockedSeconds || row.locked || 0)}</td>
                <td>{formatCompactDuration(row.offlineSeconds || row.offline || 0)}</td>
              </>
            )}
          />
        </section>
      ) : null}
    </div>
  );
}
