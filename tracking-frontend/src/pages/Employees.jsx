import { useEffect, useMemo, useState } from 'react';
import { Filter, X, Eye } from 'lucide-react';
import { getEmployees } from '../services/endpoints';
import { formatDateTime, safeText } from '../lib/format';
import { EMPLOYEE_DB_OPTIONS } from '../constants/navigation';
import { employeeName, initialsFor } from '../utils/aggregate';
import { SelectControl, ActionButton, EmptyState } from '../components/ui/Primitives';
import { DataTable } from '../components/ui/DataTable';

export function EmployeesPage({ searchTerm, onToast }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [employeeDbFilter, setEmployeeDbFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getEmployees();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        setEmployees([]);
        onToast(`Employee list unavailable: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredEmployees = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      if (employeeDbFilter === 'active' && employee.active !== true) return false;
      if (employeeDbFilter === 'inactive' && employee.active !== false) return false;
      if (!needle) return true;
      return [
        employee.employeeCode,
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.active,
        employee.createdAt,
        employee.updatedAt
      ].filter((value) => value !== undefined && value !== null).join(' ').toLowerCase().includes(needle);
    });
  }, [employees, employeeDbFilter, searchTerm]);

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h2>Employees list</h2>
        </div>
        <div className="panel-actions">
          <ActionButton icon={Filter} onClick={() => setFiltersOpen((value) => !value)}>Filters</ActionButton>
        </div>
      </div>
      {filtersOpen ? (
        <div className="filter-tray">
          <SelectControl label="Employee filter" value={employeeDbFilter} onChange={setEmployeeDbFilter} options={EMPLOYEE_DB_OPTIONS} />
          <ActionButton icon={X} onClick={() => setEmployeeDbFilter('all')}>Clear</ActionButton>
        </div>
      ) : null}
      <DataTable
        columns={['Employee ID', 'Employee Code', 'Name', 'Email', 'Active', 'Created', 'Updated', 'Actions']}
        rows={filteredEmployees}
        loading={loading}
        emptyTitle="No employees found"
        emptyText="No employee records match the current search."
        renderRow={(row) => (
          <>
            <td><strong>{safeText(row.id)}</strong></td>
            <td><strong>{safeText(row.employeeCode)}</strong></td>
            <td>
              <div className="person-cell">
                <span>{initialsFor(row)}</span>
                <b>{employeeName(row)}</b>
              </div>
            </td>
            <td>{safeText(row.email)}</td>
            <td>{row.active ? 'Yes' : 'No'}</td>
            <td>{formatDateTime(row.createdAt)}</td>
            <td>{formatDateTime(row.updatedAt)}</td>
            <td>
              <div className="row-actions">
                <button type="button" title="View profile" onClick={() => onToast('Profile view is available from the dashboard.')}><Eye size={14} />View</button>
              </div>
            </td>
          </>
        )}
      />
    </section>
  );
}
