import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LoaderCircle } from 'lucide-react';
import { createEmployee } from '../services/endpoints';
import { Field, ActionButton, ErrorBanner } from '../components/ui/Primitives';

const EMPTY_FORM = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  active: true
};

export function AddEmployeePage({ onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.employeeCode.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Employee code, first name, last name, and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createEmployee({
        employeeCode: form.employeeCode.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        active: form.active
      });
      onToast('Employee created successfully.');
      navigate('/employees');
    } catch (err) {
      setError(err.message || 'Failed to create the employee.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel form-panel">
      <div className="panel-head">
        <div>
          <h2>Add employee</h2>
          <p>Register a new employee in the tracking system.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="form-grid">
        <Field label="Employee code" required>
          <input className="input" value={form.employeeCode} onChange={(event) => update('employeeCode', event.target.value)} placeholder="EMP-0001" />
        </Field>
        <Field label="First name" required>
          <input className="input" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} placeholder="Jane" />
        </Field>
        <Field label="Last name" required>
          <input className="input" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} placeholder="Doe" />
        </Field>
        <Field label="Email" required>
          <input className="input" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="jane.doe@company.com" />
        </Field>
        <label className="field checkbox-field">
          <input type="checkbox" checked={form.active} onChange={(event) => update('active', event.target.checked)} />
          <span>Active employee</span>
        </label>

        <div className="form-actions">
          <ActionButton type="submit" variant="primary" icon={UserPlus} disabled={submitting}>
            {submitting ? 'Saving...' : 'Create employee'}
          </ActionButton>
          <ActionButton onClick={() => navigate('/employees')}>Cancel</ActionButton>
        </div>
      </form>
    </section>
  );
}
