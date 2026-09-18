'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, CheckCircle, Clock, XCircle, Download, Loader2,
  Scale, ShieldAlert, CheckCircle2, Award, FileSpreadsheet, ExternalLink
} from 'lucide-react';
import { createChecklist, exportPDF, exportExcel } from '@/services/api';
import type { ComplianceChecklist, ComplianceItem } from '@/types';
import StatutoryQCOBanner from '@/components/compliance/StatutoryQCOBanner';

const ITEM_TYPES = [
  'PRODUCT_STANDARD', 'TEST_METHOD', 'SAFETY', 'INSTALLATION',
  'CERTIFICATION', 'VERSION', 'SPECIFICATION'
];

const ITEM_TYPE_LABELS: Record<string, string> = {
  PRODUCT_STANDARD: 'Applicable product standard',
  TEST_METHOD: 'Relevant test method',
  SAFETY: 'Safety requirements',
  INSTALLATION: 'Installation requirements',
  CERTIFICATION: 'Certification requirement',
  VERSION: 'Latest edition verified',
  SPECIFICATION: 'Tender specification cross-checked',
};

const STATUS_CONFIG = {
  PENDING: { icon: Clock, color: '#d97706', label: 'Pending', bg: '#fffbeb' },
  VERIFIED: { icon: CheckCircle, color: '#059669', label: 'Verified', bg: '#f0fdf4' },
  NOT_APPLICABLE: { icon: XCircle, color: '#6b7280', label: 'N/A', bg: '#f9fafb' },
};

function ComplianceContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Omit<ComplianceItem, 'id' | 'created_at'>[]>([
    { standard_number: 'IS 1239 (Part 1): 2004', standard_title: 'Mild Steel Tubes for Water Mains', item_type: 'PRODUCT_STANDARD', status: 'VERIFIED' },
    { standard_number: 'IS 1387: 2003', standard_title: 'General Requirements for Supply of Metallurgical Materials', item_type: 'TEST_METHOD', status: 'VERIFIED' },
    { standard_number: 'IS 6392: 2020', standard_title: 'Steel Pipe Flanges for Water Pipelines', item_type: 'INSTALLATION', status: 'PENDING' },
    { standard_number: 'Section 16 BIS Act', standard_title: 'Mandatory BIS Scheme-I (ISI Mark) Certification License', item_type: 'CERTIFICATION', status: 'PENDING' },
  ]);
  const [name, setName] = useState('NIT Pipeline QCO Compliance Audit');
  const [query, setQuery] = useState('Steel pipes and allied flange fittings for water supply');
  const [saved, setSaved] = useState<ComplianceChecklist | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'excel' | null>(null);

  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'qco') {
      setName('Water Pipeline Tender QCO Statutory Verification');
      setQuery('IS 1239 & Allied Standards Mandatory QCO Compliance');
    }
  }, [searchParams]);

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
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Masthead */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.8px',
          }}>
            MODULE 04
          </span>
          <span style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>
            Statutory Enforcement Matrix &amp; Procurement Verification
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', marginBottom: 6 }}>
          Statutory QCO Matrix &amp; Compliance Checklist
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15, lineHeight: 1.5 }}>
          Enforce compliance with mandatory Quality Control Orders (QCO) issued under Section 16 of the BIS Act, 2016.
          Track verification status and export audit-ready compliance certificates for GeM and CPPP tenders.
        </p>
      </div>

      {/* Statutory QCO Banner */}
      <div style={{ marginBottom: 24 }}>
        <StatutoryQCOBanner
          standardNumber="Section 16 BIS Act 2016 Procurement Mandate"
          orderName="Mandatory Quality Control Orders issued by Line Ministries"
          gazetteRef="DoCA / DPIIT / Ministry of Steel / MeitY Gazette Notifications"
          effectiveDate="Statutorily Binding on All Public Procurements"
          scheme="Scheme-I (ISI Mark) & CRS Certification"
        />
      </div>

      {saved && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          color: '#065f46', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={16} />
          <span>Compliance record stored! Audit Reference: <code style={{ fontFamily: 'monospace', fontWeight: 700 }}>{saved.id.slice(0, 8)}...</code></span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSaved(null)} style={{ marginLeft: 'auto', fontWeight: 700 }}>
            Create Another Audit
          </button>
        </div>
      )}

      {/* Header Form */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>
              Checklist Title
            </label>
            <input
              className="input"
              style={{ fontWeight: 600 }}
              placeholder="e.g., Water Supply Pipeline NIT Audit"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1.4, minWidth: 240 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>
              Tender Specification Subject
            </label>
            <input
              className="input"
              placeholder="e.g., steel pipes and allied flanges for water distribution"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>
            Statutory Verification Items ({items.length})
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={addItem} style={{ fontWeight: 700 }}>
            <Plus size={14} /> Add Item
          </button>
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
                alignItems: 'center',
              }}
            >
              {/* Status button */}
              <button
                onClick={() => cycleStatus(idx)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  flexShrink: 0,
                }}
                title={`Status: ${item.status} — click to cycle`}
                aria-label={`Toggle status for item ${idx + 1}`}
              >
                <StatusIcon size={22} style={{ color: statusConfig.color }} />
              </button>

              <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: 160 }}>
                  <input
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                    placeholder="Standard Number"
                    value={item.standard_number || ''}
                    onChange={e => updateItem(idx, { standard_number: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 13 }}
                    placeholder="Standard Description / Requirement"
                    value={item.standard_title || ''}
                    onChange={e => updateItem(idx, { standard_title: e.target.value })}
                  />
                </div>
                <select
                  className="input"
                  style={{ width: 170, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                  value={item.item_type}
                  onChange={e => updateItem(idx, { item_type: e.target.value })}
                >
                  {ITEM_TYPES.map(type => (
                    <option key={type} value={type}>{ITEM_TYPE_LABELS[type] || type}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => removeItem(idx)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-3)', padding: 4,
                }}
                title="Remove Item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save & Export Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          onClick={() => handleExport('pdf')}
          disabled={exportLoading !== null}
        >
          {exportLoading === 'pdf' ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={15} />}
          Export Audit PDF
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleExport('excel')}
          disabled={exportLoading !== null}
        >
          {exportLoading === 'excel' ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Download size={15} />}
          Export Excel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ fontWeight: 800 }}
        >
          {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle2 size={15} />}
          Save Compliance Record
        </button>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading Compliance Matrix...</div>}>
      <ComplianceContent />
    </Suspense>
  );
}
