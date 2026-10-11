import type { ApiError, PaginatedResponse, Profile } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    // Import dynamically to avoid SSR issues
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody: ApiError = await response.json().catch(() => ({
        detail: `Request failed with status ${response.status}`,
        code: 'unknown_error',
      }));
      throw new ApiRequestError(response.status, errorBody);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /* ── Generic CRUD ──────────────────────────────────────── */
  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /* ── Profile ───────────────────────────────────────────── */
  getProfile(): Promise<Profile> {
    return this.get('/api/v1/me/');
  }

  updateProfile(data: Partial<Profile>): Promise<Profile> {
    return this.patch('/api/v1/me/', data);
  }

  /* ── Vehicles ──────────────────────────────────────────── */
  getVehicles() {
    return this.get<PaginatedResponse<import('@/types').Vehicle>>('/api/v1/me/vehicles/');
  }

  createVehicle(data: Partial<import('@/types').Vehicle>) {
    return this.post<import('@/types').Vehicle>('/api/v1/me/vehicles/', data);
  }

  /* ── Requests ──────────────────────────────────────────── */
  getRequests() {
    return this.get<PaginatedResponse<import('@/types').ChargingRequest>>('/api/v1/requests/');
  }

  getRequest(id: string) {
    return this.get<import('@/types').ChargingRequest>(`/api/v1/requests/${id}/`);
  }

  createRequest(data: Partial<import('@/types').ChargingRequest>) {
    return this.post<import('@/types').ChargingRequest>('/api/v1/requests/', data);
  }

  updateRequest(id: string, data: Partial<import('@/types').ChargingRequest>) {
    return this.patch<import('@/types').ChargingRequest>(`/api/v1/requests/${id}/`, data);
  }

  submitRequest(id: string) {
    return this.post<import('@/types').ChargingRequest>(`/api/v1/requests/${id}/submit/`);
  }

  triggerPhotoCheck(id: string) {
    return this.post<import('@/types').Assessment>(`/api/v1/requests/${id}/trigger-photo-check/`);
  }

  /* ── Evidence ──────────────────────────────────────────── */
  getEvidence(requestId: string) {
    return this.get<PaginatedResponse<import('@/types').Evidence>>(`/api/v1/requests/${requestId}/evidence/`);
  }

  getEvidenceDetail(evidenceId: string) {
    return this.get<import('@/types').Evidence>(`/api/v1/evidence/${evidenceId}/`);
  }

  /* ── Assessments ───────────────────────────────────────── */
  getAssessments(requestId: string) {
    return this.get<PaginatedResponse<import('@/types').Assessment>>(`/api/v1/requests/${requestId}/assessments/`);
  }

  getAssessment(assessmentId: string) {
    return this.get<import('@/types').Assessment>(`/api/v1/assessments/${assessmentId}/`);
  }

  /* ── Conditions ────────────────────────────────────────── */
  getConditions(requestId: string) {
    return this.get<PaginatedResponse<import('@/types').Condition>>(`/api/v1/requests/${requestId}/conditions/`);
  }

  getCondition(conditionId: string) {
    return this.get<import('@/types').Condition>(`/api/v1/conditions/${conditionId}/`);
  }

  submitConditionProof(conditionId: string, data: { evidence_ids: string[] }) {
    return this.post(`/api/v1/conditions/${conditionId}/submit-proof/`, data);
  }

  /* ── Slots ─────────────────────────────────────────────── */
  getSlots(requestId: string) {
    return this.get<PaginatedResponse<import('@/types').ChargingSlot>>(`/api/v1/requests/${requestId}/slots/`);
  }

  /* ── Billing ───────────────────────────────────────────── */
  getInvoices() {
    return this.get<PaginatedResponse<import('@/types').Invoice>>('/api/v1/invoices/');
  }

  getInvoice(invoiceId: string) {
    return this.get<import('@/types').Invoice>(`/api/v1/invoices/${invoiceId}/`);
  }

  raiseDispute(invoiceId: string, data: { reason: string }) {
    return this.post<import('@/types').Dispute>(`/api/v1/invoices/${invoiceId}/dispute/`, data);
  }

  /* ── Packets ───────────────────────────────────────────── */
  generatePacket(requestId: string) {
    return this.post<import('@/types').Packet>(`/api/v1/requests/${requestId}/generate-packet/`);
  }

  getPackets(requestId: string) {
    return this.get<PaginatedResponse<import('@/types').Packet>>(`/api/v1/requests/${requestId}/packets/`);
  }

  /* ── Activity ──────────────────────────────────────────── */
  getActivity() {
    return this.get<PaginatedResponse<import('@/types').ActivityEvent>>('/api/v1/activity/');
  }

  /* ── Overview ──────────────────────────────────────────── */
  getOwnerOverview() {
    return this.get<import('@/types').OwnerOverview>('/api/v1/me/overview/');
  }

  /* ── Deletion ──────────────────────────────────────────── */
  requestDeletion(data: { reason?: string }) {
    return this.post<import('@/types').DeletionRequest>('/api/v1/me/deletion-request/', data);
  }

  /* ── Societies ─────────────────────────────────────────── */
  getSocieties() {
    return this.get<PaginatedResponse<{ id: string; name: string }>>('/api/v1/societies/');
  }

  /* ── RWA Admin ─────────────────────────────────────────── */
  getRwaRequests() {
    return this.get<PaginatedResponse<import('@/types').ChargingRequest>>('/api/v1/rwa/requests/');
  }

  getRwaRequest(id: string) {
    return this.get<import('@/types').ChargingRequest>(`/api/v1/rwa/requests/${id}/`);
  }

  /* ── Electrician ───────────────────────────────────────── */
  getInspections() {
    return this.get<PaginatedResponse<import('@/types').ChargingRequest>>('/api/v1/electrician/inspections/');
  }

  /* ── Super Admin ───────────────────────────────────────── */
  getAdminOverview() {
    return this.get<{ societies_count: number; users_count: number; requests_count: number }>('/api/v1/admin/overview/');
  }

  /* ── ChargeSathi ───────────────────────────────────────── */
  sendChat(data: { message: string; history: import('@/types').ChatHistoryTurn[]; assessment_id?: number | string }) {
    return this.post<import('@/types').ChatResponse>('/api/v1/chat/', data);
  }
}

export class ApiRequestError extends Error {
  status: number;
  body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.detail || body.message || `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export const api = new ApiClient(API_BASE_URL);
