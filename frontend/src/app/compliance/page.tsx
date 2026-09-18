'use client';
import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Clock, XCircle, Download, Loader2 } from 'lucide-react';
import { createChecklist, exportPDF, exportExcel } from '@/services/api';
import type { ComplianceChecklist, ComplianceItem } from '@/types';

const ITEM_TYPES = [
  'PRODUCT_STANDARD', 'TEST_METHOD', 'SAFETY', 'INSTALLATION',
  'CERTIFICATION', 'VERSION', 'SPECIFICATION'
];

const ITEM_TYPE_LABELS: Record<string, string> = {
  PRODUCT_STANDARD: '☐ Applicable product standard',
  TEST_METHOD: '☐ Relevant test method',
  SAFETY: '☐ Safety requirements',
  INSTALLATION: '☐ Installation requirements',
  CERTIFICATION: '☐ Certification requirement',
  VERSION: '☐ Latest edition verified',
  SPECIFICATION: '☐ Tender specification cross-checked',
};

const STATUS_CONFIG = {
  PENDING: { icon: Clock, color: '#d97706', label: 'Pending', bg: '#fffbeb' },
  VERIFIED: { icon: CheckCircle, color: '#059669', label: 'Verified', bg: '#f0fdf4' },
  NOT_APPLICABLE: { icon: XCircle, color: '#6b7280', label: 'N/A', bg: '#f9fafb' },
};

export default function CompliancePage() {
  const [items, setItems] = useState<Omit<ComplianceItem, 'id' | 'created_at'>[]>([
    { standard_number: '', standard_title: '', item_type: 'PRODUCT_STANDARD', status: 'PENDING' },
  ]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<ComplianceChecklist | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'excel' | null>(null);

  const addItem = () => {
    setItems(prev => [...prev, {
      standard_number: '', standard_title: '',
      item_type: 'PRODUCT_STANDARD', status: 'PENDING'
    }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, changes: Partial<typeof items[0]>) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...changes } : item));
  };

  const cycleStatus = (idx: number) => {
    const statuses: ComplianceItem['status'][] = ['PENDING', 'VERIFIED', 'NOT_APPLICABLE'];
    const current = items[idx].status;
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    updateItem(idx, { status: next });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await createChecklist({
        name: name || `Checklist ${new Date().toLocaleDateString()}`,
        query,
        items: items.map(item => ({
          standard_number: item.standard_number || undefined,
          standard_title: item.standard_title || undefined,
          item_type: item.item_type,
          notes: undefined,
        })),
      });
      setSaved(res as ComplianceChecklist);
    } catch {
      alert('Failed to save checklist.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportLoading(format);
    try {
      const payload = {
        query: query || name || 'Compliance Checklist',
        results: [],
        checklist_items: items.map((item, i) => ({
          id: `item-${i}`,
          item_type: item.item_type,
          standard_number: item.standard_number,
          standard_title: item.standard_title,
          status: item.status,
        })),
      };
      if (format === 'pdf') await exportPDF(payload);
      else await exportExcel(payload);
    } catch { alert('Export failed.'); }
    finally { setExportLoading(null); }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Compliance Checklist</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          Build and track compliance requirements for procurement specifications. Export as PDF or Excel.
        </p>
      </div>

      {saved && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: '#065f46', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={16} />
          <span>Checklist saved! ID: <code style={{ fontFamily: 'monospace' }}>{saved.id.slice(0, 8)}...</code></span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSaved(null)} style={{ marginLeft: 'auto' }}>
            New Checklist
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: 4 }}>
              Checklist Name
            </label>
            <input
              className="input"
              placeholder="e.g., Steel Pipes Procurement Checklist"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: 4 }}>
              Related Query / Specification
            </label>
            <input
              className="input"
              placeholder="e.g., steel pipes for water supply"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Checklist Items ({items.length})</h2>
          <button className="btn btn-ghost btn-sm" onClick={addItem}>
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: 'var(--color-text-2)' }}>
          {Object.entries(STATUS_CONFIG).map(([key, { icon: Icon, color, label }]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon size={12} style={{ color }} />
              <span>{label}</span>
            </div>
          ))}
          <span style={{ color: 'var(--color-text-3)' }}>Click status icon to cycle</span>
        </div>

        {items.map((item, idx) => {
          const statusConfig = STATUS_CONFIG[item.status];
          const StatusIcon = statusConfig.icon;
          return (
            <div
              key={idx}
              className="checklist-item"
              style={{
                marginBottom: 8,
                background: statusConfig.bg,
                borderColor: item.status === 'VERIFIED' ? '#bbf7d0' : item.status === 'NOT_APPLICABLE' ? '#e5e7eb' : 'var(--color-border)',
              }}
            >
              {/* Status button */}
              <button
                onClick={() => cycleStatus(idx)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  flexShrink: 0, marginTop: 2,
                }}
                title={`Status: ${item.status} — click to change`}
                aria-label={`Toggle status for item ${idx + 1}`}
              >
                <StatusIcon size={20} style={{ color: statusConfig.color }} />
              </button>

              <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 150 }}>
                  <select
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 12, width: '100%' }}
                    value={item.item_type}
                    onChange={e => updateItem(idx, { item_type: e.target.value as ComplianceItem['item_type'] })}
                  >
                    {ITEM_TYPES.map(t => (
                      <option key={t} value={t}>{ITEM_TYPE_LABELS[t] || t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <input
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 12 }}
                    placeholder="IS number (e.g., IS 1239)"
                    value={item.standard_number || ''}
                    onChange={e => updateItem(idx, { standard_number: e.target.value })}
                  />
                </div>
                <div style={{ flex: 2, minWidth: 140 }}>
                  <input
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 12 }}
                    placeholder="Standard title (optional)"
                    value={item.standard_title || ''}
                    onChange={e => updateItem(idx, { standard_title: e.target.value })}
                  />
                </div>
              </div>

              <button
                className="btn btn-ghost btn-icon"
                onClick={() => removeItem(idx)}
                aria-label="Remove item"
                style={{ flexShrink: 0, padding: 4 }}
              >
                <Trash2 size={14} style={{ color: '#dc2626' }} />
              </button>
            </div>
          );
        })}

        <button className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 8 }}>
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={14} />}
          Save Checklist
        </button>
        <button className="btn btn-secondary" onClick={() => handleExport('pdf')} disabled={exportLoading !== null}>
          {exportLoading === 'pdf' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={14} />}
          Export PDF
        </button>
        <button className="btn btn-secondary" onClick={() => handleExport('excel')} disabled={exportLoading !== null}>
          {exportLoading === 'excel' ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={14} />}
          Export Excel
        </button>
      </div>

      {/* Summary */}
      <div style={{ marginTop: 20, display: 'flex', gap: 16 }}>
        {Object.entries(STATUS_CONFIG).map(([key, { color, label }]) => {
          const count = items.filter(i => i.status === key).length;
          return (
            <div key={key} style={{ fontSize: 14 }}>
              <strong style={{ color }}>{count}</strong>
              <span style={{ color: 'var(--color-text-2)', marginLeft: 4 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
