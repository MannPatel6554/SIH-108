'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getStandards } from '@/services/api';
import type { Standard } from '@/types';

const SECTORS = ['', 'CONSTRUCTION', 'ELECTRICAL', 'ELECTRONICS', 'MECHANICAL', 'WATER', 'HEALTHCARE', 'GENERAL'];
const TYPES = ['', 'PRODUCT', 'TEST_METHOD', 'SAFETY', 'TERMINOLOGY', 'INSTALLATION', 'MANAGEMENT'];

const STATUS_COLORS: Record<string, string> = {
  CURRENT: '#059669', SUPERSEDED: '#d97706', WITHDRAWN: '#dc2626',
  DEMO: '#7c3aed', AMENDED: '#2563eb', UNKNOWN: '#6b7280',
};

export default function StandardsPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [total, setTotal] = useState(0);

  const fetchStandards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStandards({
        q: search || undefined,
        sector: sector || undefined,
        standard_type: type || undefined,
        skip: page * pageSize,
        limit: pageSize,
      });
      const data = res as Standard[];
      setStandards(data);
      // Approximate total from result length
      if (data.length === pageSize) setTotal(page * pageSize + pageSize + 1);
      else setTotal(page * pageSize + data.length);
    } catch {
      setStandards([]);
    } finally {
      setLoading(false);
    }
  }, [search, sector, type, page]);

  useEffect(() => { fetchStandards(); }, [fetchStandards]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchStandards();
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          <BookOpen size={24} style={{ display: 'inline', marginRight: 8 }} />
          Standards Explorer
        </h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          Browse authoritative Indian Standards (BIS) and verified procurement specifications.
          <span className="badge badge-official">Official BIS Data Active</span>
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by number, title, keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 140, padding: '8px 12px', fontSize: 13 }}
            value={sector} onChange={e => { setSector(e.target.value); setPage(0); }}>
            {SECTORS.map(s => <option key={s} value={s}>{s || 'All Sectors'}</option>)}
          </select>
          <select className="input" style={{ width: 160, padding: '8px 12px', fontSize: 13 }}
            value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
            {TYPES.map(s => <option key={s} value={s}>{s || 'All Types'}</option>)}
          </select>
          <button className="btn btn-primary" type="submit">
            <Search size={14} /> Search
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-2)' }}>Loading...</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Standard Number</th>
                  <th style={{ width: '35%' }}>Title</th>
                  <th>Sector</th>
                  <th>Type</th>
                  <th>Edition</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {standards.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-3)' }}>
                      No standards found. Try a different search.
                    </td>
                  </tr>
                ) : (
                  standards.map(std => (
                    <tr key={std.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>
                          {std.standard_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{std.title}</div>
                        {std.title_hindi && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontStyle: 'italic', marginTop: 2 }}>
                            {std.title_hindi}
                          </div>
                        )}
                      </td>
                      <td><span className="badge badge-sector" style={{ fontSize: 11 }}>{std.sector}</span></td>
                      <td><span className="badge badge-type" style={{ fontSize: 11 }}>{std.standard_type?.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{std.edition_year || '—'}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px',
                          borderRadius: 100, background: '#f3f4f6',
                          color: STATUS_COLORS[std.status] || '#6b7280',
                        }}>
                          {std.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          std.verification_status === 'OFFICIAL_VERIFIED' ? 'badge-official' :
                          std.verification_status === 'PUBLIC_BIS_DATA' ? 'badge-public-bis' :
                          std.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-demo'
                        }`} style={{ fontSize: 10 }}>
                          {std.verification_status === 'OFFICIAL_VERIFIED' ? 'OFFICIAL BIS' :
                           std.verification_status === 'PUBLIC_BIS_DATA' ? 'PUBLIC BIS' :
                           std.verification_status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/standards/${std.id}`} className="btn btn-ghost btn-sm">
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, fontSize: 13, color: 'var(--color-text-2)',
          }}>
            <span>Showing {page * pageSize + 1}–{page * pageSize + standards.length}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={standards.length < pageSize}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
