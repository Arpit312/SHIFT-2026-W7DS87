import type { Role, RequestStatus, ConditionStatus, Verdict, Severity, EvidenceCategory, InvoiceStatus, SlotStatus } from '@/lib/constants';

/* ── User & Profile ────────────────────────────────────────── */
export interface Profile {
  id: string;
  supabase_user_id: string;
  role: Role;
  full_name: string;
  phone: string;
  flat_number: string;
  society_id: string;
  society_name: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  manufacturer: string;
  model: string;
  battery_capacity_kwh: number | null;
  charger_power_kw: number;
  charger_rated_voltage: number | null;
  manual_url: string | null;
  created_at: string;
}

/* ── Charging Request ──────────────────────────────────────── */
export interface SiteQuestionnaire {
  socket_circuit_rating: string;
  dedicated_or_shared: 'dedicated' | 'shared' | 'unknown';
  earthing: 'known' | 'absent' | 'unknown';
  indoor_outdoor: 'indoor' | 'outdoor';
  cable_route: string;
  parking_details: string;
}

export interface ChargingRequest {
  id: string;
  request_number: string;
  owner_id: string;
  vehicle_id: string;
  vehicle: Vehicle;
  society_id: string;
  status: RequestStatus;
  site_questionnaire: SiteQuestionnaire | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

/* ── Evidence ──────────────────────────────────────────────── */
export interface Evidence {
  id: string;
  evidence_id: string;
  request_id: string;
  category: EvidenceCategory;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  uploader_name: string;
  linked_finding_id: string | null;
  is_corrective: boolean;
  condition_addressed_id: string | null;
  created_at: string;
}

/* ── Assessment (AI Integration Contract) ──────────────────── */
export interface EvidenceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Reading {
  field: string;
  value: number | string;
  unit: string | null;
  confidence: number | null;
  source_photo_id: string;
}

export interface Finding {
  finding_id: string;
  title: string;
  severity: Severity;
  explanation: string;
  confidence: number | null;
  source_photo_id: string;
  evidence_region: EvidenceRegion | null;
  recommended_action: string;
  requires_electrician: boolean;
  status: 'unresolved' | 'resolved';
}

export interface SuggestedCondition {
  title: string;
  explanation: string;
  required_action: string;
  responsible_party: string;
  required_evidence: string;
}

export interface Assessment {
  request_id: string;
  assessment_id: string;
  assessment_version: number;
  assessed_at: string;
  overall_verdict: Verdict;
  confidence: number | null;
  readings: Reading[];
  findings: Finding[];
  missing_information: string[];
  conditions: SuggestedCondition[];
  requires_human_review: boolean;
  limitations: string[];
  is_demo: boolean;
}

/* ── Condition ─────────────────────────────────────────────── */
export interface ConditionEvent {
  id: string;
  condition_id: string;
  event_type: string;
  actor_name: string;
  comment: string;
  created_at: string;
}

export interface Condition {
  id: string;
  request_id: string;
  title: string;
  explanation: string;
  required_action: string;
  responsible_party: string;
  required_evidence: string;
  deadline: string | null;
  status: ConditionStatus;
  source_finding_id: string | null;
  events: ConditionEvent[];
  created_at: string;
  updated_at: string;
}

/* ── Charging Slot ─────────────────────────────────────────── */
export interface ChargingSlot {
  id: string;
  request_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  charger_power_kw: number;
  status: SlotStatus;
  is_demo: boolean;
  created_at: string;
}

/* ── Billing ───────────────────────────────────────────────── */
export interface SessionEstimate {
  id: string;
  slot_id: string;
  charger_power_kw: number;
  duration_minutes: number;
  estimated_kwh: number;
  meter_reconciliation_factor: number | null;
  raw_estimation_error: number | null;
  tariff_per_kwh: number;
  amount: number;
  is_demo: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  owner_id: string;
  billing_cycle_id: string;
  total_amount: number;
  status: InvoiceStatus;
  sessions: SessionEstimate[];
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dispute {
  id: string;
  invoice_id: string;
  raised_by: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Packet ────────────────────────────────────────────────── */
export interface Packet {
  id: string;
  request_id: string;
  version: number;
  download_url: string;
  generated_by: string;
  sections_included: string[];
  created_at: string;
}

/* ── Activity ──────────────────────────────────────────────── */
export interface ActivityEvent {
  id: string;
  request_id: string | null;
  actor_name: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/* ── Deletion Request ──────────────────────────────────────── */
export interface DeletionRequest {
  id: string;
  requested_by: string;
  status: 'pending' | 'processing' | 'completed' | 'denied';
  reason: string | null;
  created_at: string;
  processed_at: string | null;
}

/* ── API Response Wrappers ─────────────────────────────────── */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail: string;
  code: string;
  errors?: Record<string, string[]>;
}

/* ── Overview Stats ────────────────────────────────────────── */
export interface OwnerOverview {
  active_requests: ChargingRequest[];
  pending_conditions_count: number;
  latest_assessment: Assessment | null;
  next_slot: ChargingSlot | null;
  latest_invoice: Invoice | null;
  recent_activity: ActivityEvent[];
}
