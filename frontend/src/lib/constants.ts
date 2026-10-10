/* ── Roles ──────────────────────────────────────────────────── */
export const ROLES = {
  EV_OWNER: 'ev_owner',
  RWA_ADMIN: 'rwa_admin',
  ELECTRICIAN: 'electrician',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.EV_OWNER]: 'EV Owner',
  [ROLES.RWA_ADMIN]: 'RWA Admin',
  [ROLES.ELECTRICIAN]: 'Electrician',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};

export const ROLE_DASHBOARD_PATHS: Record<Role, string> = {
  [ROLES.EV_OWNER]: '/dashboard/owner',
  [ROLES.RWA_ADMIN]: '/dashboard/rwa',
  [ROLES.ELECTRICIAN]: '/dashboard/electrician',
  [ROLES.SUPER_ADMIN]: '/dashboard/admin',
};

/* ── Request Statuses ──────────────────────────────────────── */
export const REQUEST_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PHOTO_CHECK_PENDING: 'photo_check_pending',
  REVIEW_REQUIRED: 'review_required',
  CORRECTIVE_ACTION_REQUIRED: 'corrective_action_required',
  AWAITING_VERIFICATION: 'awaiting_verification',
  AWAITING_RWA_DECISION: 'awaiting_rwa_decision',
  APPROVED: 'approved',
  APPROVED_WITH_CONDITIONS: 'approved_with_conditions',
  REJECTED: 'rejected',
  CLOSED: 'closed',
} as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[keyof typeof REQUEST_STATUSES];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [REQUEST_STATUSES.DRAFT]: 'Draft',
  [REQUEST_STATUSES.SUBMITTED]: 'Submitted',
  [REQUEST_STATUSES.PHOTO_CHECK_PENDING]: 'Photo Check Pending',
  [REQUEST_STATUSES.REVIEW_REQUIRED]: 'Manual Review or Electrician Inspection Required',
  [REQUEST_STATUSES.CORRECTIVE_ACTION_REQUIRED]: 'Corrective Action Required',
  [REQUEST_STATUSES.AWAITING_VERIFICATION]: 'Awaiting Verification',
  [REQUEST_STATUSES.AWAITING_RWA_DECISION]: 'Awaiting RWA Decision',
  [REQUEST_STATUSES.APPROVED]: 'Approved',
  [REQUEST_STATUSES.APPROVED_WITH_CONDITIONS]: 'Approved with Conditions',
  [REQUEST_STATUSES.REJECTED]: 'Rejected',
  [REQUEST_STATUSES.CLOSED]: 'Closed',
};

/* ── Condition Statuses ────────────────────────────────────── */
export const CONDITION_STATUSES = {
  PENDING: 'pending',
  PROOF_SUBMITTED: 'proof_submitted',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REWORK_REQUIRED: 'rework_required',
} as const;

export type ConditionStatus = (typeof CONDITION_STATUSES)[keyof typeof CONDITION_STATUSES];

export const CONDITION_STATUS_LABELS: Record<ConditionStatus, string> = {
  [CONDITION_STATUSES.PENDING]: 'Pending',
  [CONDITION_STATUSES.PROOF_SUBMITTED]: 'Proof Submitted',
  [CONDITION_STATUSES.UNDER_REVIEW]: 'Under Review',
  [CONDITION_STATUSES.VERIFIED]: 'Verified',
  [CONDITION_STATUSES.REWORK_REQUIRED]: 'Rework Required',
};

/* ── Verdicts ──────────────────────────────────────────────── */
export const VERDICTS = {
  YES: 'yes',
  YES_WITH_CONDITIONS: 'yes_with_conditions',
  ELECTRICIAN_FIRST: 'electrician_first',
  NEEDS_REVIEW: 'needs_review',
} as const;

export type Verdict = (typeof VERDICTS)[keyof typeof VERDICTS];

export const VERDICT_LABELS: Record<Verdict, string> = {
  [VERDICTS.YES]: 'Yes',
  [VERDICTS.YES_WITH_CONDITIONS]: 'Yes, with Conditions',
  [VERDICTS.ELECTRICIAN_FIRST]: 'Electrician Inspection First',
  [VERDICTS.NEEDS_REVIEW]: 'Needs Review',
};

/* ── Severities ────────────────────────────────────────────── */
export const SEVERITIES = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
} as const;

export type Severity = (typeof SEVERITIES)[keyof typeof SEVERITIES];

export const SEVERITY_LABELS: Record<Severity, string> = {
  [SEVERITIES.CRITICAL]: 'Critical',
  [SEVERITIES.MAJOR]: 'Major',
  [SEVERITIES.MINOR]: 'Minor',
};

/* ── Upload Constraints ────────────────────────────────────── */
export const UPLOAD = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ACCEPTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  // TODO(team): HEIC support TBD
  ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;

/* ── Evidence Categories ───────────────────────────────────── */
export const EVIDENCE_CATEGORIES = {
  CHARGER_LABEL: 'charger_label',
  PARKING_LOCATION: 'parking_location',
  NEAREST_SOCKET: 'nearest_socket',
  CORRECTIVE: 'corrective',
  ELECTRICIAN_REPORT: 'electrician_report',
} as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[keyof typeof EVIDENCE_CATEGORIES];

/* ── Invoice Statuses ──────────────────────────────────────── */
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  DISPUTED: 'disputed',
  OVERDUE: 'overdue',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES];

/* ── Slot Statuses ─────────────────────────────────────────── */
export const SLOT_STATUSES = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type SlotStatus = (typeof SLOT_STATUSES)[keyof typeof SLOT_STATUSES];

/* ── Haan Packet Disclaimer ────────────────────────────────── */
export const HAAN_PACKET_DISCLAIMER =
  'This document records a request and a decision. It is not a legal NOC or an electrical safety certificate.';

/* ── ChargeSathi ───────────────────────────────────────────── */
export const CHARGESATHI_DISCLAIMER =
  'AI assistant, may be wrong. Not electrical certification.';

export const CHARGESATHI_STARTERS = [
  'How does a ChargeNOC charging request work?',
  'What photos do I need to upload for Photo Check?',
  'What is a Haan Packet?',
  'Charging will not start. What should I check first?',
] as const;

/* ── Photo Upload Slot Guidance ────────────────────────────── */
export const PHOTO_SLOT_GUIDANCE = {
  [EVIDENCE_CATEGORIES.CHARGER_LABEL]:
    'Photograph the charger nameplate or label showing manufacturer name, power rating (watts or kilowatts), voltage, and any certifications. Ensure text is legible.',
  [EVIDENCE_CATEGORIES.PARKING_LOCATION]:
    'Photograph your parking spot showing the charger installation location, cable routing, and surrounding area. Include the nearest pillar or wall marking for reference.',
  [EVIDENCE_CATEGORIES.NEAREST_SOCKET]:
    'Photograph the electrical socket, board, or distribution panel that the charger connects to. Show the MCB/switch ratings if visible.',
} as const;
