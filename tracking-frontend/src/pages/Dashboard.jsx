import { useEffect, useMemo, useState } from 'react';
import { Users, Activity, Clock3, Lock, WifiOff, Filter, X, Eye } from 'lucide-react';
import { getHomeDashboard, getDailySummary, getApplicationUsage } from '../services/endpoints';
import { formatCompactDuration, safeText } from '../lib/format';
import { TREND_MODES, STATUS_OPTIONS } from '../constants/navigation';
import { groupTrendRows, percent, employeeName, initialsFor, statusClass, displayLastSeen, normalizeStatus } from '../utils/aggregate';
import { rangeForTrend, todayDate } from '../utils/date';
import { KpiCard, SelectControl, ActionButton, EmptyState, ErrorBanner, Panel } from '../components/ui/Primitives';
import { DataTable } from '../components/ui/DataTable';
import { TrendChart, StatusDonut, CategoryDonut } from '../components/charts/Charts';
import { ProfilePanel } from '../components/profile/ProfilePanel';


export function DashboardPage({ selectedDate, onToast }) {
  const [employees, setEmployees] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trendMode, setTrendMode] = useState('day');
  const [trendRows, setTrendRows] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [categoryBuckets, setCategoryBuckets] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);


  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const data = await getHomeDashboard({
        page: 0,
        size: 100,
        sortBy: 'lastSeenAt',
        sortDirection: 'DESC',
        date: selectedDate
      });
      setEmployees(Array.isArray(data?.employees) ? data.employees : []);
      setCounts(data?.counts || null);
    } catch (err) {
      setEmployees([]);
      setCounts(null);
      setError(`Live data unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrend(mode) {
    setTrendLoading(true);
    try {
      const rows = await getDailySummary({
        ...rangeForTrend(mode),
        page: 0,
        size: 500
      });
      setTrendRows(groupTrendRows(Array.isArray(rows) ? rows : [], mode));
    } catch {
      setTrendRows([]);
    } finally {
      setTrendLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const rows = await getApplicationUsage({ date: selectedDate, page: 0, size: 500 });
      const buckets = { Productive: 0, Neutral: 0, Unproductive: 0, Uncategorized: 0 };
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const category = row.category || 'Uncategorized';
        const seconds = Number(row.activeSeconds || row.active || 0);
        if (buckets[category] !== undefined) buckets[category] += seconds;
        else buckets.Uncategorized += seconds;
      });
      buckets.total = Object.values(buckets).reduce((sum, value) => sum + value, 0);
      setCategoryBuckets(buckets);
    } catch {
      setCategoryBuckets(null);
    }
  }

  // OPTIMIZATION: Batch dashboard and categories loading into single effect
  useEffect(() => {
    loadDashboard();
    loadCategories();
  }, [selectedDate]);

  useEffect(() => {
    loadTrend(trendMode);
  }, [trendMode]);


  async function openEmployeeProfile(employee) {
    setProfile(employee);
    setProfileLoading(true);
    try {
      const data = await getHomeDashboard({ page: 0, size: 1, date: selectedDate });
      const match = (data?.employees || []).find((row) => row.employeeId === employee.employeeId);
      setProfile({ ...employee, ...match });
    } catch {
      // keep the row data as the profile
    } finally {
      setProfileLoading(false);
    }
  }

  const derivedCounts = useMemo(() => {
    if (counts) {
      return {
        total: counts.totalEmployees ?? employees.length,
        active: counts.activeEmployees ?? 0,
        idle: counts.idleEmployees ?? 0,
        locked: counts.lockedEmployees ?? 0,
        offline: counts.offlineEmployees ?? 0
      };
    }
    return employees.reduce(
      (acc, employee) => {
        acc.total += 1;
        const key = normalizeStatus(employee.currentStatus).toLowerCase();
        if (acc[key] !== undefined) acc[key] += 1;
        return acc;
      },
      { total: 0, active: 0, idle: 0, locked: 0, offline: 0 }
    );
  }, [counts, employees]);

  const visibleEmployees = useMemo(() => {
    if (statusFilter === 'all') return employees;
    return employees.filter((employee) => normalizeStatus(employee.currentStatus) === statusFilter);
  }, [employees, statusFilter]);

  // OPTIMIZATION: Single reduce pass instead of two separate reductions
  const productivity = useMemo(() => {
    const totals = trendRows.reduce(
      (acc, row) => {
        acc.totalActive += row.active;
        acc.totalIdle += row.idle;
        return acc;
      },
      { totalActive: 0, totalIdle: 0 }
    );
    const total = totals.totalActive + totals.totalIdle;
    const score = total ? Math.round((totals.totalActive / total) * 100) : 0;
    return { ...totals, total, score };
  }, [trendRows]);

  function profileOperation(label) {
    if (label === 'Refresh profile') {
      onToast('Profile refresh needs a live profile endpoint.');
      return;
    }
    if (label === 'Edit employee') {
      onToast('Edit needs an update endpoint. This server currently exposes create employee only.');
      return;
    }
    if (label === 'Deactivate employee') {
      onToast('Deactivate needs a backend endpoint before this action can be saved.');
      return;
    }
    onToast(`${label} selected.`);
  }

  return (
    <div className={`dashboard-shell ${profile ? 'has-profile' : ''}`}>
      <section className="dashboard-main">
        <ErrorBanner message={error} />

        <section className="kpi-grid five">
          <KpiCard icon={Users} label="Total Employees" value={derivedCounts.total} detail="Registered workforce" tone="blue" percentValue={100} />
          <KpiCard icon={Activity} label="Active" value={derivedCounts.active} detail={`${percent(derivedCounts.active, derivedCounts.total)}% of total`} tone="green" percentValue={percent(derivedCounts.active, derivedCounts.total)} />
          <KpiCard icon={Clock3} label="Idle" value={derivedCounts.idle} detail={`${percent(derivedCounts.idle, derivedCounts.total)}% of total`} tone="amber" percentValue={percent(derivedCounts.idle, derivedCounts.total)} />
          <KpiCard icon={Lock} label="Locked" value={derivedCounts.locked} detail={`${percent(derivedCounts.locked, derivedCounts.total)}% of total`} tone="purple" percentValue={percent(derivedCounts.locked, derivedCounts.total)} />
          <KpiCard icon={WifiOff} label="Offline" value={derivedCounts.offline} detail={`${percent(derivedCounts.offline, derivedCounts.total)}% of total`} tone="red" percentValue={percent(derivedCounts.offline, derivedCounts.total)} />
        </section>

        <section className="dashboard-grid">
          <Panel
            className="trend-box wide"
            title="Activity trend"
            subtitle="Active, idle, locked, and offline time by selected range."
            actions={<SelectControl label="Range" value={trendMode} onChange={setTrendMode} options={TREND_MODES} />}
          >
            {trendLoading ? (
              <EmptyState title="Loading trend" text="Reading live report data from the server." />
            ) : trendRows.length ? (
              <>
                <TrendChart rows={trendRows} />
                <div className="metric-ribbon">
                  <span>Total tracked <b>{formatCompactDuration(productivity.total)}</b></span>
                  <span>Active total <b>{formatCompactDuration(productivity.totalActive)}</b></span>
                  <span>Productivity <b>{productivity.score}/100</b></span>
                </div>
              </>
            ) : (
              <EmptyState title="No trend data" text="No live usage rows were returned for this range." />
            )}
          </Panel>
          <StatusDonut counts={derivedCounts} />
          {categoryBuckets ? <CategoryDonut buckets={categoryBuckets} /> : null}
        </section>


        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>Live Employees <span className="live-badge">Live</span></h2>
            </div>
            <div className="panel-actions">
              <ActionButton icon={Filter} onClick={() => setFiltersOpen((value) => !value)}>Filters</ActionButton>
            </div>
          </div>
          {filtersOpen ? (
            <div className="filter-tray">
              <SelectControl label="Employee status filter" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
              <ActionButton icon={X} onClick={() => setStatusFilter('all')}>Clear</ActionButton>
            </div>
          ) : null}
          <DataTable
            columns={['Employee Code', 'Name', 'Email', 'Status', 'Active Today', 'Last Seen', 'Actions']}
            rows={visibleEmployees}
            loading={loading}
            emptyTitle="No employees found"
            emptyText="No employees match the current search or live API response."
            renderRow={(row) => (
              <>
                <td><strong>{safeText(row.employeeCode)}</strong></td>
                <td>
                  <div className="person-cell">
                    <span>{initialsFor(row)}</span>
                    <b>{employeeName(row)}</b>
                  </div>
                </td>
                <td>{safeText(row.email)}</td>
                <td><span className={statusClass(row.currentStatus)}>{safeText(row.currentStatus)}</span></td>
                <td>{formatCompactDuration(row.activeSecondsToday || row.activeSeconds || 0)}</td>
                <td>{displayLastSeen(row.lastSeenAt)}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" title="View profile" onClick={() => openEmployeeProfile(row)}><Eye size={14} />View</button>
                  </div>
                </td>
              </>
            )}
          />
        </section>
      </section>

      {profile ? (
        <ProfilePanel
          profile={profile}
          loading={profileLoading}
          onOperation={profileOperation}
          onClose={() => setProfile(null)}
        />
      ) : null}
    </div>
  );
}
