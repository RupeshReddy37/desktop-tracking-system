import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Pencil, Search, Tag } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryRules,
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
  classifyApp
} from '../services/endpoints';
import { safeText } from '../lib/format';
import { ActionButton, IconButton, Field, EmptyState, ErrorBanner, Panel } from '../components/ui/Primitives';
import { DataTable } from '../components/ui/DataTable';

const MATCH_TYPES = [
  { id: 'APP_NAME', label: 'App name' },
  { id: 'WINDOW_TITLE', label: 'Window title' },
  { id: 'URL_DOMAIN', label: 'URL / domain' }
];

const EMPTY_CATEGORY = { name: '', color: '#6366f1', productive: true };
const EMPTY_RULE = { categoryId: '', matchType: 'APP_NAME', pattern: '', priority: 0, enabled: true };

export function CategoriesPage({ onToast }) {
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [editingRuleId, setEditingRuleId] = useState(null);

  const [tester, setTester] = useState({ appName: '', windowTitle: '' });
  const [testResult, setTestResult] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [categoryData, ruleData] = await Promise.all([getCategories(), getCategoryRules()]);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setRules(Array.isArray(ruleData) ? ruleData : []);
    } catch (err) {
      setError(`Categories unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetCategoryForm() {
    setCategoryForm(EMPTY_CATEGORY);
    setEditingCategoryId(null);
  }

  function resetRuleForm() {
    setRuleForm(EMPTY_RULE);
    setEditingRuleId(null);
  }

  async function saveCategory() {
    try {
      const payload = {
        name: categoryForm.name,
        color: categoryForm.color,
        productive: categoryForm.productive
      };
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        onToast('Category updated.');
      } else {
        await createCategory(payload);
        onToast('Category created.');
      }
      resetCategoryForm();
      await load();
    } catch (err) {
      onToast(`Save failed: ${err.message}`);
    }
  }

  function startEditCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, color: category.color || '#6366f1', productive: category.productive });
  }

  async function removeCategory(category) {
    if (!window.confirm(`Delete category "${category.name}" and its rules?`)) return;
    try {
      await deleteCategory(category.id);
      onToast('Category deleted.');
      await load();
    } catch (err) {
      onToast(`Delete failed: ${err.message}`);
    }
  }

  async function saveRule() {
    if (!ruleForm.categoryId) {
      onToast('Select a category for the rule.');
      return;
    }
    try {
      const payload = {
        categoryId: Number(ruleForm.categoryId),
        matchType: ruleForm.matchType,
        pattern: ruleForm.pattern,
        priority: Number(ruleForm.priority || 0),
        enabled: ruleForm.enabled
      };
      if (editingRuleId) {
        await updateCategoryRule(editingRuleId, payload);
        onToast('Rule updated.');
      } else {
        await createCategoryRule(payload);
        onToast('Rule created.');
      }
      resetRuleForm();
      await load();
    } catch (err) {
      onToast(`Save failed: ${err.message}`);
    }
  }

  function startEditRule(rule) {
    setEditingRuleId(rule.id);
    setRuleForm({
      categoryId: String(rule.categoryId),
      matchType: rule.matchType,
      pattern: rule.pattern,
      priority: rule.priority,
      enabled: rule.enabled
    });
  }

  async function removeRule(rule) {
    if (!window.confirm(`Delete rule "${rule.pattern}"?`)) return;
    try {
      await deleteCategoryRule(rule.id);
      onToast('Rule deleted.');
      await load();
    } catch (err) {
      onToast(`Delete failed: ${err.message}`);
    }
  }

  async function runTest() {
    setTestResult(null);
    try {
      const result = await classifyApp({ appName: tester.appName, windowTitle: tester.windowTitle });
      setTestResult(result);
    } catch (err) {
      onToast(`Test failed: ${err.message}`);
    }
  }

  return (
    <div className="categories-page">
      <ErrorBanner message={error} />

      <Panel
        title="Categories"
        subtitle="Named productivity categories used to classify applications and websites."
        actions={<ActionButton icon={RefreshCw} onClick={load}>Refresh</ActionButton>}
      >
        <div className="form-grid">
          <Field label="Name" required>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
              placeholder="e.g. Productive"
            />
          </Field>
          <Field label="Color">
            <input
              type="color"
              value={categoryForm.color}
              onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })}
            />
          </Field>
          <Field label="Productive">
            <select
              value={categoryForm.productive ? 'true' : 'false'}
              onChange={(event) => setCategoryForm({ ...categoryForm, productive: event.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
          <div className="form-actions">
            <ActionButton icon={Plus} variant="primary" onClick={saveCategory}>
              {editingCategoryId ? 'Update category' : 'Add category'}
            </ActionButton>
            {editingCategoryId ? (
              <ActionButton onClick={resetCategoryForm}>Cancel</ActionButton>
            ) : null}
          </div>
        </div>

        <DataTable
          columns={['Category', 'Color', 'Productive', 'Rules', 'Actions']}
          rows={categories}
          loading={loading}
          emptyTitle="No categories"
          emptyText="Create a category to start classifying applications."
          renderRow={(category) => (
            <>
              <td>
                <div className="person-cell">
                  <span><Tag size={14} /></span>
                  <b>{safeText(category.name)}</b>
                </div>
              </td>
              <td>
                <span className="color-swatch" style={{ backgroundColor: category.color || '#6366f1' }} />
              </td>
              <td>{category.productive ? 'Yes' : 'No'}</td>
              <td>{rules.filter((rule) => rule.categoryId === category.id).length}</td>
              <td>
                <div className="row-actions">
                  <IconButton icon={Pencil} label="Edit" title="Edit" onClick={() => startEditCategory(category)} />
                  <IconButton icon={Trash2} label="Delete" title="Delete" onClick={() => removeCategory(category)} />
                </div>
              </td>
            </>
          )}
        />
      </Panel>

      <Panel
        title="Classification rules"
        subtitle="Ordered matching rules. First match wins; lower priority is evaluated first."
        actions={<ActionButton icon={RefreshCw} onClick={load}>Refresh</ActionButton>}
      >
        <div className="form-grid">
          <Field label="Category" required>
            <select
              value={ruleForm.categoryId}
              onChange={(event) => setRuleForm({ ...ruleForm, categoryId: event.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Match type" required>
            <select
              value={ruleForm.matchType}
              onChange={(event) => setRuleForm({ ...ruleForm, matchType: event.target.value })}
            >
              {MATCH_TYPES.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Pattern" required>
            <input
              type="text"
              value={ruleForm.pattern}
              onChange={(event) => setRuleForm({ ...ruleForm, pattern: event.target.value })}
              placeholder="e.g. IntelliJ"
            />
          </Field>
          <Field label="Priority">
            <input
              type="number"
              value={ruleForm.priority}
              onChange={(event) => setRuleForm({ ...ruleForm, priority: event.target.value })}
            />
          </Field>
          <Field label="Enabled">
            <select
              value={ruleForm.enabled ? 'true' : 'false'}
              onChange={(event) => setRuleForm({ ...ruleForm, enabled: event.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
          <div className="form-actions">
            <ActionButton icon={Plus} variant="primary" onClick={saveRule}>
              {editingRuleId ? 'Update rule' : 'Add rule'}
            </ActionButton>
            {editingRuleId ? (
              <ActionButton onClick={resetRuleForm}>Cancel</ActionButton>
            ) : null}
          </div>
        </div>

        <DataTable
          columns={['Category', 'Match type', 'Pattern', 'Priority', 'Enabled', 'Actions']}
          rows={rules}
          loading={loading}
          emptyTitle="No rules"
          emptyText="Add a rule to classify applications into categories."
          renderRow={(rule) => (
            <>
              <td>{safeText(rule.categoryName)}</td>
              <td>{safeText(rule.matchType)}</td>
              <td><code>{safeText(rule.pattern)}</code></td>
              <td>{rule.priority}</td>
              <td>{rule.enabled ? 'Yes' : 'No'}</td>
              <td>
                <div className="row-actions">
                  <IconButton icon={Pencil} label="Edit" title="Edit" onClick={() => startEditRule(rule)} />
                  <IconButton icon={Trash2} label="Delete" title="Delete" onClick={() => removeRule(rule)} />
                </div>
              </td>
            </>
          )}
        />
      </Panel>

      <Panel title="Classification tester" subtitle="Preview how an application or window title would be classified.">
        <div className="form-grid">
          <Field label="App name">
            <input
              type="text"
              value={tester.appName}
              onChange={(event) => setTester({ ...tester, appName: event.target.value })}
              placeholder="e.g. IntelliJ"
            />
          </Field>
          <Field label="Window title">
            <input
              type="text"
              value={tester.windowTitle}
              onChange={(event) => setTester({ ...tester, windowTitle: event.target.value })}
              placeholder="e.g. Main.java - IntelliJ IDEA"
            />
          </Field>
          <div className="form-actions">
            <ActionButton icon={Search} variant="primary" onClick={runTest}>Classify</ActionButton>
          </div>
        </div>
        {testResult ? (
          <div className="test-result">
            <strong>{safeText(testResult.categoryName)}</strong>
            <span>{testResult.productive ? 'Productive' : 'Not productive'}</span>
            <small>Matched {safeText(testResult.matchType)}: {safeText(testResult.matchedPattern)}</small>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
