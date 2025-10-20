export type Stage =
  | 'INGESTION'
  | 'TRANSFORMATION'
  | 'ENRICHMENT'
  | 'VALIDATION'
  | 'VISUALIZATION'
  | 'DEPLOYMENT';

export type InitiativeStatus =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'BLOCKED'
  | 'COMPLETE'
  | 'ARCHIVED';

export type HealthStatus = 'HEALTHY' | 'WATCH' | 'CRITICAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskStatus = 'OPEN' | 'MITIGATED' | 'CLOSED';

export type AssetType =
  | 'DATASET'
  | 'MODEL'
  | 'DASHBOARD'
  | 'PIPELINE'
  | 'REPORT'
  | 'OTHER';

export type DependencyStatus = 'OPEN' | 'BLOCKED' | 'CLEARED';

export type SOWStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SIGNED_OFF';

export type OnboardingStatus = 'AWAITING' | 'IN_PROGRESS' | 'COMPLETED';

export type AccessStatus = 'REQUESTED' | 'IN_PROGRESS' | 'GRANTED' | 'BLOCKED';

export type StageApprovalRole = 'PROJECT_MANAGER' | 'DATA_ARCHITECT';

export interface StageChecklistItem {
  id: string;
  stage: Stage;
  title: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
}

export interface StageHistory {
  id: string;
  fromStage: Stage | null;
  toStage: Stage;
  reason?: string | null;
  actor?: string | null;
  createdAt: string;
}

export interface DataAsset {
  id: string;
  initiativeId: string;
  name: string;
  type: AssetType;
  ownerTeam: string;
  steward?: string | null;
  acceptanceCriteria?: string | null;
  notes?: string | null;
  createdAt: string;
  initiative?: Pick<Initiative, 'id' | 'name' | 'stage' | 'status'>;
}

export interface Risk {
  id: string;
  initiativeId: string;
  title: string;
  description: string;
  severity: RiskLevel;
  status: RiskStatus;
  mitigationPlan?: string | null;
  identifiedAt: string;
  resolvedAt?: string | null;
  owner?: string | null;
}

export interface Dependency {
  id: string;
  initiativeId: string;
  name: string;
  description?: string | null;
  type: string;
  status: DependencyStatus;
  externalSystem?: string | null;
  dueDate?: string | null;
}

export interface ScopeOfWork {
  id: string;
  initiativeId: string;
  summary: string;
  deliverables: string;
  status: SOWStatus;
  pmOwner: string;
  architectOwner: string;
  pmApproved: boolean;
  pmApprovedAt?: string | null;
  architectApproved: boolean;
  architectApprovedAt?: string | null;
  signedOffAt?: string | null;
  lastReviewedAt?: string | null;
}

export interface StageApproval {
  id: string;
  initiativeId: string;
  stage: Stage;
  role: StageApprovalRole;
  approved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  team: string;
  onboardingStatus: OnboardingStatus;
  startDate?: string | null;
}

export interface InitiativeAssignment {
  id: string;
  initiativeId: string;
  responsibility: string;
  assignedAt: string;
  member: TeamMember;
}

export interface AccessProvision {
  id: string;
  initiativeId: string;
  memberId: string;
  systemName: string;
  status: AccessStatus;
  requestedAt?: string | null;
  fulfilledAt?: string | null;
  notes?: string | null;
  member: TeamMember;
}

export interface Initiative {
  id: string;
  name: string;
  description: string;
  stage: Stage;
  status: InitiativeStatus;
  healthStatus: HealthStatus;
  riskLevel: RiskLevel;
  sowReference?: string | null;
  engagementLead?: string | null;
  projectManager?: string | null;
  dataArchitect?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
  checklistItems: StageChecklistItem[];
  stageHistory: StageHistory[];
  assets: DataAsset[];
  risks: Risk[];
  dependencies: Dependency[];
  approvals: StageApproval[];
  scopeOfWork?: ScopeOfWork | null;
  assignments: InitiativeAssignment[];
  accessRequests: AccessProvision[];
}

export interface MetricsOverview {
  byStage: Record<Stage, number>;
  byStatus: Record<InitiativeStatus, number>;
  health: Record<HealthStatus, number>;
  riskHotspots: Array<{
    initiativeId: string;
    initiativeName: string;
    riskId: string;
    riskTitle: string;
    severity: RiskLevel;
  }>;
  blockedDependencies: number;
  overdueInitiatives: number;
  averageCycleTimeDays: number | null;
}

export interface InitiativesResponse {
  initiatives: Initiative[];
}

export interface AssetsResponse {
  assets: DataAsset[];
}

export interface MetricsResponse {
  metrics: MetricsOverview;
}

export interface ScopeResponse {
  scope: ScopeOfWork;
}

export interface ScopeAndApprovalsResponse {
  scope: ScopeOfWork;
  approvals: StageApproval[];
}

export interface ApprovalResponse {
  approval: StageApproval;
}

export interface AccessResponse {
  access: AccessProvision;
}

export interface MemberResponse {
  member: TeamMember;
}
