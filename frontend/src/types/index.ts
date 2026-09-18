// BIS SmartSpec AI — TypeScript Types

export interface ScoreBreakdown {
  semantic_score: number;
  lexical_score: number;
  metadata_score: number;
  final_score: number;
}

export interface CertificationInfo {
  id: string;
  product_category: string | null;
  certification_type: string | null;
  is_mandatory: string;
  scheme: string | null;
  effective_date: string | null;
  verification_status: string;
  source: string | null;
  notes: string | null;
}

export interface EvidenceItem {
  text: string;
  source: string;
}

export interface RecommendationResult {
  standard_id: string;
  standard_number: string;
  title: string;
  title_hindi?: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  score_breakdown?: ScoreBreakdown;
  verification_status: string;
  status: string;
  standard_type: string;
  sector: string;
  edition_year?: number;
  why_relevant: string;
  evidence: EvidenceItem[];
  limitations: string[];
  certifications: CertificationInfo[];
  allied_standards_count: number;
  source_name?: string;
  source_url?: string;
  source_type?: string;
  retrieved_at?: string;
  content_access?: string;
}

export interface SearchResponse {
  query: string;
  language: string;
  results: RecommendationResult[];
  total_results: number;
  search_time_ms: number;
  llm_used: boolean;
  disclaimer: string;
}

export interface SearchRequest {
  query: string;
  language?: string;
  top_k?: number;
  filters?: {
    sector?: string;
    standard_type?: string;
    status?: string;
    verification_status?: string;
  };
}

export interface RelatedStandard {
  id: string;
  standard_number: string;
  title: string;
  relationship_type: string;
  description?: string;
  status: string;
  verification_status: string;
}

export interface StandardVersion {
  id: string;
  edition_year?: number;
  amendment_number?: string;
  amendment_date?: string;
  amendment_title?: string;
  is_current: boolean;
  superseded_by?: string;
  notes?: string;
}

export interface Standard {
  id: string;
  standard_number: string;
  title: string;
  title_hindi?: string;
  part?: string;
  edition_year?: number;
  status: string;
  standard_type: string;
  sector: string;
  description?: string;
  description_hindi?: string;
  keywords: string[];
  verification_status: string;
  source_url?: string;
  source_name?: string;
  source_type?: string;
  retrieved_at?: string;
  last_checked_at?: string;
  content_access?: string;
  license_status?: string;
  product_manual_url?: string;
  product_manual_title?: string;
  certifications: CertificationInfo[];
  created_at?: string;
  scope?: string;
  versions?: StandardVersion[];
  related_standards?: RelatedStandard[];
  ics_code?: string;
  pages?: number;
}

export interface DocumentAnalysisResponse {
  document_id: string;
  filename: string;
  detected_standards: string[];
  extracted_text_preview: string;
  recommendations: RecommendationResult[];
  potential_gaps: string[];
  potential_outdated: Array<{
    referenced: string;
    newer_record: string;
    action: string;
  }>;
  processing_time_ms: number;
}

export interface VersionCheckRequest {
  standard_number: string;
  referenced_year?: number;
}

export interface VersionCheckResponse {
  standard_number: string;
  found: boolean;
  current_record?: Standard;
  is_potentially_outdated: boolean;
  newer_record_year?: number;
  message: string;
}

export interface ComplianceItem {
  id: string;
  standard_id?: string;
  standard_number?: string;
  standard_title?: string;
  item_type: string;
  status: 'PENDING' | 'VERIFIED' | 'NOT_APPLICABLE';
  notes?: string;
  created_at?: string;
}

export interface ComplianceChecklist {
  id: string;
  name?: string;
  query?: string;
  items: ComplianceItem[];
  created_at?: string;
}

export interface Stats {
  total_standards: number;
  verified_standards: number;
  demo_standards: number;
  total_relationships: number;
  searches_performed: number;
  documents_analyzed: number;
  checklists_created: number;
  mode: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  mode: string;
  services: {
    vector_store: {
      available: boolean;
      document_count: number;
    };
    embedding_model: {
      available: boolean;
      model: string;
    };
    llm: {
      provider: string;
      available: boolean;
    };
  };
}

export type Language = 'en' | 'hi';

export interface Translation {
  [key: string]: string;
}

// MSME Mode
export interface AppSettings {
  language: Language;
  msmeMode: boolean;
  top_k: number;
}
