import type {
  HealthStatus,
  InitiativeStatus,
  OnboardingStatus,
  AccessStatus,
  SOWStatus,
  RiskLevel,
  StageApprovalRole,
  Stage,
} from './types';

export const STAGE_SEQUENCE: Stage[] = [
  'INGESTION',
  'TRANSFORMATION',
  'ENRICHMENT',
  'VALIDATION',
  'VISUALIZATION',
  'DEPLOYMENT',
];

export const STAGE_LABELS: Record<Stage, string> = {
  INGESTION: 'Ingestion',
  TRANSFORMATION: 'Transformation',
  ENRICHMENT: 'Enrichment',
  VALIDATION: 'Validation',
  VISUALIZATION: 'Visualization',
  DEPLOYMENT: 'Deployment',
};

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  INGESTION: 'Source onboarding, extraction, and landing zones',
  TRANSFORMATION: 'Modeling, cleansing, and harmonization',
  ENRICHMENT: 'Business logic, feature engineering, semantic layers',
  VALIDATION: 'Quality gates, reconciliation, and governance checks',
  VISUALIZATION: 'Dashboards, reporting, storytelling deliverables',
  DEPLOYMENT: 'Production rollout, adoption, and hyper-care',
};

export const STATUS_COLORS: Record<InitiativeStatus, string> = {
  ON_TRACK: 'var(--status-on-track)',
  AT_RISK: 'var(--status-at-risk)',
  BLOCKED: 'var(--status-blocked)',
  COMPLETE: 'var(--status-complete)',
  ARCHIVED: 'var(--status-archived)',
};

export const HEALTH_BADGES: Record<HealthStatus, string> = {
  HEALTHY: 'var(--health-healthy)',
  WATCH: 'var(--health-watch)',
  CRITICAL: 'var(--health-critical)',
};

export const RISK_BADGES: Record<RiskLevel, string> = {
  LOW: 'var(--risk-low)',
  MEDIUM: 'var(--risk-medium)',
  HIGH: 'var(--risk-high)',
  CRITICAL: 'var(--risk-critical)',
};

export const SOW_STATUS_LABELS: Record<SOWStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  SIGNED_OFF: 'Signed Off',
};

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  AWAITING: 'Awaiting Kickoff',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  REQUESTED: 'Requested',
  IN_PROGRESS: 'In Progress',
  GRANTED: 'Granted',
  BLOCKED: 'Blocked',
};

export const APPROVAL_ROLE_LABELS: Record<StageApprovalRole, string> = {
  PROJECT_MANAGER: 'Project Manager',
  DATA_ARCHITECT: 'Data Architect',
};

export const getNextStage = (current: Stage): Stage | null => {
  const index = STAGE_SEQUENCE.indexOf(current);
  if (index === -1 || index === STAGE_SEQUENCE.length - 1) {
    return null;
  }
  return STAGE_SEQUENCE[index + 1];
};
