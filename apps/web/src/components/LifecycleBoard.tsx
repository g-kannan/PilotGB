import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  advanceInitiativeStage,
  fetchInitiatives,
  toggleChecklistItem,
  updateInitiative,
  deleteInitiative,
  updateStageApproval,
} from '../lib/api';
import { APPROVAL_ROLE_LABELS, STAGE_DESCRIPTIONS, STAGE_LABELS, STAGE_SEQUENCE, STATUS_COLORS, HEALTH_BADGES, RISK_BADGES, PROJECT_TYPE_LABELS, DATA_COMPLEXITY_LABELS, DATA_SENSITIVITY_LABELS, getNextStage } from '../constants';
import type { Initiative, Stage, StageChecklistItem, StageApprovalRole, ProjectType } from '../types';

const describeStatus = (status: string) => status.replace('_', ' ');

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  const normalized = value > 1 ? value : value * 100;
  const rounded = Math.round(normalized * 10) / 10;
  return `${rounded}%`;
};

const formatNumber = (value?: number | null, fractionDigits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return fractionDigits > 0
    ? value.toFixed(fractionDigits)
    : value.toString();
};

const deriveChecklistProgress = (
  initiative: Initiative,
  stage: Stage,
): {
  items: StageChecklistItem[];
  completed: number;
  total: number;
} => {
  const items = initiative.checklistItems.filter(
    (item) => item.stage === stage,
  );
  const completed = items.filter((item) => item.completed).length;
  return {
    items,
    completed,
    total: items.length,
  };
};

export const LifecycleBoard = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['initiatives'],
    queryFn: fetchInitiatives,
    staleTime: 30_000,
  });

  const checklistMutation = useMutation<
    { checklist: unknown },
    Error,
    { initiativeId: string; checklistId: string; completed: boolean }
  >({
    mutationFn: ({ initiativeId, checklistId, completed }) =>
      toggleChecklistItem(initiativeId, checklistId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  const transitionMutation = useMutation<
    unknown,
    Error,
    { initiativeId: string; targetStage: Stage }
  >({
    mutationFn: ({ initiativeId, targetStage }) =>
      advanceInitiativeStage(initiativeId, {
        targetStage,
        actor: 'web-ui',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const approvalMutation = useMutation<
    unknown,
    Error,
    {
      initiativeId: string;
      approvalId: string;
      approved: boolean;
      approverName?: string | null;
    }
  >({
    mutationFn: ({ initiativeId, approvalId, approved, approverName }) =>
      updateStageApproval(initiativeId, approvalId, {
        approved,
        approvedBy: approved ? approverName ?? 'Approver' : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  const updateInitiativeMutation = useMutation<
    unknown,
    Error,
    { initiativeId: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ initiativeId, data }) =>
      updateInitiative(initiativeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const deleteInitiativeMutation = useMutation<unknown, Error, string>({
    mutationFn: (initiativeId) => deleteInitiative(initiativeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const REQUIRED_APPROVAL_ROLES: StageApprovalRole[] = [
    'PROJECT_MANAGER',
    'DATA_ARCHITECT',
  ];

  const initiativesByStage = useMemo(() => {
    const groups = new Map<Stage, Initiative[]>();
    STAGE_SEQUENCE.forEach((stage) => groups.set(stage, []));

    data?.initiatives.forEach((initiative) => {
      groups.get(initiative.stage)?.push(initiative);
    });

    return groups;
  }, [data]);

  if (isLoading) {
    return (
      <section className="panel">
        <header className="panel__header">
          <div>
            <h2>Lifecycle Board</h2>
            <p>Tracking initiatives across the PilotGB lifecycle.</p>
          </div>
        </header>
        <div className="panel__body">
          <p>Loading initiatives…</p>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="panel">
        <header className="panel__header">
          <div>
            <h2>Lifecycle Board</h2>
            <p>Tracking initiatives across the PilotGB lifecycle.</p>
          </div>
        </header>
        <div className="panel__body panel__body--error">
          <p>{error instanceof Error ? error.message : 'Failed to load initiatives.'}</p>
        </div>
      </section>
    );
  }

  const mutationError =
    checklistMutation.error ||
    transitionMutation.error ||
    approvalMutation.error ||
    updateInitiativeMutation.error ||
    deleteInitiativeMutation.error;

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Lifecycle Board</h2>
          <p>Monitor progression, quality gates, and stage readiness.</p>
        </div>
        {mutationError && (
          <div className="alert alert--error">
            <strong>Action failed: </strong>
            {mutationError instanceof Error
              ? mutationError.message
              : 'Unknown error'}
          </div>
        )}
      </header>
      <div className="board">
        {STAGE_SEQUENCE.map((stage) => (
          <div key={stage} className="board__column">
            <header className="board__column-header">
              <h3>{STAGE_LABELS[stage]}</h3>
              <p>{STAGE_DESCRIPTIONS[stage]}</p>
            </header>
            <div className="board__column-body">
              {initiativesByStage.get(stage)?.length ? (
                initiativesByStage
                  .get(stage)!
                  .map((initiative) => {
                    const { items, completed, total } =
                      deriveChecklistProgress(initiative, stage);
                    const approvalsForStage = initiative.approvals.filter(
                      (approval) => approval.stage === stage,
                    );
                    const checklistReady = total === 0 || completed === total;
                    const approvalsReady = REQUIRED_APPROVAL_ROLES.every((role) =>
                      approvalsForStage.some(
                        (approval) => approval.role === role && approval.approved,
                      ),
                    );
                    const readyForTransition = checklistReady && approvalsReady;
                    const nextStage = getNextStage(stage);
                    const isAdvancing =
                      transitionMutation.isPending &&
                      transitionMutation.variables?.initiativeId ===
                        initiative.id;
                    const dataMetrics = initiative.scopeOfWork?.dataMetrics;
                    const aiMetrics = initiative.scopeOfWork?.aiMetrics;
                    const isUpdatingOwners =
                      updateInitiativeMutation.isPending &&
                      updateInitiativeMutation.variables?.initiativeId ===
                        initiative.id;
                    const isDeleting =
                      deleteInitiativeMutation.isPending &&
                      deleteInitiativeMutation.variables === initiative.id;

                    const handleUpdateOwners = () => {
                      const pmInput = window.prompt(
                        'Project Manager',
                        initiative.projectManager ?? '',
                      );
                      if (pmInput === null) {
                        return;
                      }
                      const architectInput = window.prompt(
                        'Data Architect',
                        initiative.dataArchitect ?? '',
                      );
                      if (architectInput === null) {
                        return;
                      }

                      const payload: Record<string, string> = {};
                      if (pmInput.trim()) {
                        payload.projectManager = pmInput.trim();
                      }
                      if (architectInput.trim()) {
                        payload.dataArchitect = architectInput.trim();
                      }

                      if (Object.keys(payload).length === 0) {
                        return;
                      }

                      updateInitiativeMutation.mutate({
                        initiativeId: initiative.id,
                        data: payload,
                      });
                    };

                    const handleDeleteInitiative = () => {
                      if (
                        !window.confirm(
                          `Delete project "${initiative.name}" and all related data? This cannot be undone.`,
                        )
                      ) {
                        return;
                      }
                      deleteInitiativeMutation.mutate(initiative.id);
                    };

                    return (
                      <article key={initiative.id} className="card">
                        <header className="card__header">
                          <div>
                            <h4>{initiative.name}</h4>
                            <p>{initiative.description}</p>
                          </div>
                          <div className="card__badges">
                            <span
                              className="badge"
                              style={{ backgroundColor: STATUS_COLORS[initiative.status] }}
                            >
                              {describeStatus(initiative.status)}
                            </span>
                            <span
                              className="badge"
                              style={{ backgroundColor: HEALTH_BADGES[initiative.healthStatus] }}
                            >
                              {initiative.healthStatus}
                            </span>
                            <span
                              className="badge"
                              style={{ backgroundColor: RISK_BADGES[initiative.riskLevel] }}
                            >
                              Risk: {initiative.riskLevel}
                            </span>
                          </div>
                        </header>
                        <section className="card__section">
                          <div className="card__meta">
                            {initiative.sowReference && (
                              <div>
                                <span className="card__meta-label">SOW</span>
                                <span>{initiative.sowReference}</span>
                              </div>
                            )}
                            {initiative.engagementLead && (
                              <div>
                                <span className="card__meta-label">Lead</span>
                                <span>{initiative.engagementLead}</span>
                              </div>
                            )}
                            {initiative.targetDate && (
                              <div>
                                <span className="card__meta-label">Target</span>
                                <span>
                                  {new Date(initiative.targetDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          {initiative.scopeOfWork && (
                            <div className="card__meta card__meta--owners">
                              <div>
                                <span className="card__meta-label">Project Type</span>
                                <span>
                                  {
                                    PROJECT_TYPE_LABELS[
                                      initiative.scopeOfWork.projectType
                                    ]
                                  }
                                </span>
                              </div>
                              {initiative.projectManager && (
                                <div>
                                  <span className="card__meta-label">Project Manager</span>
                                  <span>{initiative.projectManager}</span>
                                </div>
                              )}
                              {initiative.dataArchitect && (
                                <div>
                                  <span className="card__meta-label">Data Architect</span>
                                  <span>{initiative.dataArchitect}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {dataMetrics && (
                            <div className="card__metrics">
                              <span className="card__metrics-title">Data Scope</span>
                              <div className="card__metrics-grid">
                                <span>
                                  Sources: {dataMetrics.dataSources}
                                </span>
                                <span>
                                  Tables: {dataMetrics.tables}
                                </span>
                                <span>
                                  Pipelines: {dataMetrics.pipelines}
                                </span>
                                <span>
                                  Dashboards: {dataMetrics.dashboards}
                                </span>
                                <span>
                                  Models: {dataMetrics.models}
                                </span>
                                <span>
                                  Volume: {formatNumber(dataMetrics.volumeTb, 1)}{' '}
                                  TB
                                </span>
                              </div>
                              <div className="card__metrics-footnote">
                                Complexity:{' '}
                                {DATA_COMPLEXITY_LABELS[dataMetrics.complexity]}{' '}
                                · Sensitivity:{' '}
                                {DATA_SENSITIVITY_LABELS[dataMetrics.sensitivity]}
                              </div>
                            </div>
                          )}
                          {aiMetrics && (
                            <div className="card__metrics">
                              <span className="card__metrics-title">AI Scope</span>
                              <div className="card__metrics-grid">
                                <span>
                                  Model: {aiMetrics.modelType ?? '—'}
                                </span>
                                <span>
                                  Use Case: {aiMetrics.useCase ?? '—'}
                                </span>
                                <span>
                                  Accuracy:{' '}
                                  {formatPercent(aiMetrics.baselineAccuracy)} →{' '}
                                  {formatPercent(aiMetrics.targetAccuracy)}
                                </span>
                                <span>
                                  Training Data:{' '}
                                  {formatNumber(aiMetrics.trainingDataTb, 1)}{' '}
                                  TB
                                </span>
                                <span>
                                  Features: {formatNumber(aiMetrics.featureCount)}
                                </span>
                                <span>
                                  Iterations: {formatNumber(aiMetrics.trainingIterations)}
                                </span>
                                <span>
                                  Status: {aiMetrics.deploymentStatus}
                                </span>
                              </div>
                              {aiMetrics.monitoringKpis && (
                                <p className="card__metrics-note">
                                  KPIs: {aiMetrics.monitoringKpis}
                                </p>
                              )}
                            </div>
                          )}
                        </section>
                        <section className="card__section">
                          <div className="card__progress">
                            <span>
                              Stage Checklist ({completed}/{total})
                            </span>
                            <div className="progress">
                              <div
                                className="progress__bar"
                                style={{
                                  width: `${total === 0 ? 0 : Math.round((completed / total) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <ul className="card__checklist">
                            {items.map((item) => {
                              const isUpdating =
                                checklistMutation.isPending &&
                                checklistMutation.variables?.checklistId ===
                                  item.id;
                              return (
                                <li key={item.id}>
                                  <label className="checkbox">
                                    <input
                                      type="checkbox"
                                      checked={item.completed}
                                      disabled={isUpdating}
                                      onChange={() =>
                                        checklistMutation.mutate({
                                          initiativeId: initiative.id,
                                          checklistId: item.id,
                                          completed: !item.completed,
                                        })
                                      }
                                    />
                                    <span>{item.title}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="card__approvals">
                            <span>Stage Approvals</span>
                            <ul>
                              {REQUIRED_APPROVAL_ROLES.map((role) => {
                                const approval = approvalsForStage.find(
                                  (item) => item.role === role,
                                );
                                const isUpdating =
                                  approvalMutation.isPending &&
                                  approvalMutation.variables?.approvalId ===
                                    approval?.id;
                                const approverName =
                                  role === 'PROJECT_MANAGER'
                                    ? initiative.projectManager
                                    : initiative.dataArchitect;
                                return (
                                  <li key={role}>
                                    <label className="checkbox">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(approval?.approved)}
                                        disabled={!approval || isUpdating}
                                        onChange={() =>
                                          approval &&
                                          approvalMutation.mutate({
                                            initiativeId: initiative.id,
                                            approvalId: approval.id,
                                            approved: !approval.approved,
                                            approverName,
                                          })
                                        }
                                      />
                                      <span>
                                        {APPROVAL_ROLE_LABELS[role]}
                                        {approval?.approved &&
                                          approval.approvedBy && (
                                            <> · {approval.approvedBy}</>
                                          )}
                                      </span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </section>
                        <section className="card__section card__section--footer">
                          <div className="card__footer-info">
                            {!!initiative.risks.length && (
                              <span className="chip">
                                Risks: {initiative.risks.length}
                              </span>
                            )}
                            {!!initiative.dependencies.length && (
                              <span className="chip">
                                Dependencies: {initiative.dependencies.length}
                              </span>
                            )}
                          </div>
                          <div className="card__footer-actions">
                            {nextStage && (
                              <button
                                className="button"
                                disabled={!readyForTransition || isAdvancing}
                                onClick={() =>
                                  transitionMutation.mutate({
                                    initiativeId: initiative.id,
                                    targetStage: nextStage,
                                  })
                                }
                              >
                                {isAdvancing
                                  ? 'Advancing…'
                                  : readyForTransition
                                  ? `Move to ${STAGE_LABELS[nextStage]}`
                                  : checklistReady
                                  ? 'Awaiting stage approvals'
                                  : 'Complete checklist to advance'}
                              </button>
                            )}
                            <div className="card__secondary-actions">
                              <button
                                type="button"
                                className="button button--ghost"
                                onClick={handleUpdateOwners}
                                disabled={isUpdatingOwners}
                              >
                                {isUpdatingOwners ? 'Saving…' : 'Set Owners'}
                              </button>
                              <button
                                type="button"
                                className="button button--danger"
                                onClick={handleDeleteInitiative}
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </section>
                      </article>
                    );
                  })
              ) : (
                <p className="board__empty">No initiatives currently in this stage.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
