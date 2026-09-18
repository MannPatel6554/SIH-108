// BIS SmartSpec AI — API Service Layer

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `API error ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchStandards(request: {
  query: string;
  language?: string;
  top_k?: number;
  filters?: Record<string, string>;
}) {
  return apiRequest('/search', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function submitSearchFeedback(data: {
  query: string;
  standard_id: string;
  standard_number: string;
  is_relevant: boolean;
  rating?: number;
  user_comment?: string;
  user_role?: string;
}) {
  return apiRequest('/search/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Standards ────────────────────────────────────────────────────────────────

export async function getStandards(params: {
  q?: string;
  sector?: string;
  standard_type?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  return apiRequest(`/standards?${query.toString()}`);
}

export async function getStandard(id: string) {
  return apiRequest(`/standards/${id}`);
}

export async function getRelatedStandards(id: string, relationship_type?: string) {
  const params = relationship_type ? `?relationship_type=${relationship_type}` : '';
  return apiRequest(`/standards/${id}/related${params}`);
}

// ─── Document Analysis ────────────────────────────────────────────────────────

export async function analyzeDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = `${API_BASE}/analyze-document`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Document analysis failed');
  }

  return response.json();
}

export async function analyzeSampleTender() {
  return apiRequest('/analyze-sample-tender', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}


// ─── Version Check ────────────────────────────────────────────────────────────

export async function checkVersion(request: {
  standard_number: string;
  referenced_year?: number;
}) {
  return apiRequest('/version-check', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export async function createChecklist(request: {
  name?: string;
  query?: string;
  items: Array<{
    standard_id?: string;
    standard_number?: string;
    standard_title?: string;
    item_type: string;
    notes?: string;
  }>;
}) {
  return apiRequest('/compliance-check', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateChecklistItem(
  checklistId: string,
  itemId: string,
  status: string,
  notes?: string
) {
  return apiRequest(`/compliance-check/${checklistId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats() {
  return apiRequest('/stats');
}

export async function getHealth() {
  const url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}/health`;
  const response = await fetch(url);
  return response.json();
}

export async function getDataSources() {
  return apiRequest('/data-sources');
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportPDF(request: {
  query: string;
  results: unknown[];
  checklist_items?: unknown[];
  include_explanations?: boolean;
}) {
  const url = `${API_BASE}/export/pdf`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('PDF export failed');
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'bis_smartspec_report.pdf';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}

export async function exportExcel(request: {
  query: string;
  results: unknown[];
  checklist_items?: unknown[];
}) {
  const url = `${API_BASE}/export/excel`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Excel export failed');
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'bis_smartspec_report.xlsx';
  a.click();
  URL.revokeObjectURL(downloadUrl);
}
