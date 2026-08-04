import { useState } from 'react';
import { Save, LoaderCircle } from 'lucide-react';
import { Field, ActionButton, ErrorBanner } from '../components/ui/Primitives';

export function SettingsPage({ onToast }) {
  const [form, setForm] = useState({
    companyName: 'Work Day',
    timezone: 'Asia/Calcutta',
    idleThreshold: '60',
    autoRefresh: '30'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Settings are stored locally in the current implementation.
      localStorage.setItem('tracking.settings', JSON.stringify(form));
      onToast('Settings saved locally.');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel form-panel">
      <div className="panel-head">
        <div>
          <h2>Settings</h2>
          <p>Console preferences. These are stored locally in the browser.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSave} className="form-grid">
        <Field label="Company name">
          <input className="input" value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
        </Field>
        <Field label="Timezone">
          <input className="input" value={form.timezone} onChange={(event) => update('timezone', event.target.value)} />
        </Field>
        <Field label="Idle threshold (seconds)">
          <input className="input" type="number" value={form.idleThreshold} onChange={(event) => update('idleThreshold', event.target.value)} />
        </Field>
        <Field label="Auto refresh (seconds)">
          <input className="input" type="number" value={form.autoRefresh} onChange={(event) => update('autoRefresh', event.target.value)} />
        </Field>

        <div className="form-actions">
          <ActionButton type="submit" variant="primary" icon={Save} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </ActionButton>
        </div>
      </form>
    </section>
  );
}
