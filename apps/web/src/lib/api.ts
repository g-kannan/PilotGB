import type {
  AccessResponse,
  AccessStatus,
  AssetsResponse,
  InitiativesResponse,
  MemberResponse,
  MetricsResponse,
  OnboardingStatus,
  ScopeAndApprovalsResponse,
  ScopeResponse,
  Stage,
  ApprovalResponse,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  '',
) ?? '';

const buildUrl = (path: string) =>
  API_BASE ? `${API_BASE}${path}` : path;

interface RequestOptions extends RequestInit {
  body?: unknown;
}

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody.error === 'string'
        ? errorBody.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const fetchInitiatives = () =>
  request<InitiativesResponse>('/api/initiatives');

export const fetchAssets = () => request<AssetsResponse>('/api/assets');

export const fetchMetrics = () =>
  request<MetricsResponse>('/api/metrics/overview');

export const toggleChecklistItem = (
  initiativeId: string,
  checklistId: string,
  completed: boolean,
) =>
  request<{ checklist: unknown }>(
    `/api/initiatives/${initiativeId}/checklists/${checklistId}`,
    {
      method: 'PATCH',
      body: { completed },
    },
  );

export const advanceInitiativeStage = (
  initiativeId: string,
  payload: { targetStage: Stage; reason?: string; actor?: string },
) =>
  request(`/api/initiatives/${initiativeId}/transition`, {
    method: 'POST',
    body: payload,
  });

export const fetchScopeAndApprovals = (initiativeId: string) =>
  request<ScopeAndApprovalsResponse>(
    `/api/initiatives/${initiativeId}/sow`,
  );

export const updateScope = (
  initiativeId: string,
  payload: Partial<{
    summary: string;
    deliverables: string;
    status: string;
    pmApproved: boolean;
    architectApproved: boolean;
  }>,
) =>
  request<ScopeResponse>(`/api/initiatives/${initiativeId}/sow`, {
    method: 'PATCH',
    body: payload,
  });

export const updateStageApproval = (
  initiativeId: string,
  approvalId: string,
  payload: { approved: boolean; approvedBy?: string; notes?: string },
) =>
  request<ApprovalResponse>(
    `/api/initiatives/${initiativeId}/approvals/${approvalId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const updateAccessProvision = (
  initiativeId: string,
  accessId: string,
  payload: Partial<{
    status: AccessStatus;
    notes: string;
    fulfilled: boolean;
  }>,
) =>
  request<AccessResponse>(
    `/api/initiatives/${initiativeId}/access/${accessId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const updateTeamMemberOnboarding = (
  initiativeId: string,
  memberId: string,
  payload: { onboardingStatus: OnboardingStatus; startDate?: string },
) =>
  request<MemberResponse>(
    `/api/initiatives/${initiativeId}/team-members/${memberId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
