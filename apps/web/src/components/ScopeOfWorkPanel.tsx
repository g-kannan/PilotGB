import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchInitiatives, updateScope } from '../lib/api';
import {
  APPROVAL_ROLE_LABELS,
  DATA_COMPLEXITY_LABELS,
  DATA_SENSITIVITY_LABELS,
  MODEL_DEPLOYMENT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  SOW_STATUS_LABELS,
} from '../constants';
import type {
  Initiative,
  ProjectType,
  SOWStatus,
} from '../types';

const statusOrder: SOWStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'SIGNED_OFF'];

const parseIntField = (value: FormDataEntryValue | null) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : undefined;
};

const parseFloatField = (value: FormDataEntryValue | null) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
};

const hasMetricValue = (value: unknown) =>
  value !== undefined && value !== null && value !== '';

const toPercentInput = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  const normalized = value > 1 ? value : value * 100;
  return normalized.toString();
};

export const ScopeOfWorkPanel = () => {
  const queryClient = useQueryClient();
  const [projectTypes, setProjectTypes] = useState<Record<string, ProjectType>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['initiatives'],
    queryFn: fetchInitiatives,
    staleTime: 30_000,
  });

  const mutation = useMutation<
    unknown,
    Error,
    { initiativeId: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ initiativeId, data: body }) =>
      updateScope(initiativeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  const initiatives = useMemo<Initiative[]>(() => {
    if (!data?.initiatives) {
      return [];
    }
    return [...data.initiatives].sort((a, b) =>
      statusOrder.indexOf(a.scopeOfWork?.status ?? 'DRAFT') -
      statusOrder.indexOf(b.scopeOfWork?.status ?? 'DRAFT'),
    );
  }, [data]);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Scope of Work</h2>
          <p>Define scope, track sign-offs, and unblock execution.</p>
        </div>
        {mutation.error && (
          <div className="alert alert--error">
            <strong>Update failed:</strong>{' '}
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Unknown error'}
          </div>
        )}
      </header>
      <div className="panel__body">
        {isLoading && <p>Loading scope�?�</p>}
        {isError && (
          <p className="panel__body--error">
            {error instanceof Error ? error.message : 'Unable to load scope data.'}
          </p>
        )}
        {!isLoading && !isError && (
          <div className="sow-list">
            {initiatives.map((initiative) => {
              const scope = initiative.scopeOfWork;
              if (!scope) {
                return null;
              }
              const canSignOff =
                scope.pmApproved &&
                scope.architectApproved &&
                scope.status !== 'SIGNED_OFF';
              const selectedProjectType =
                projectTypes[initiative.id] ?? scope.projectType;
              const dataMetrics = scope.dataMetrics;
              const aiMetrics = scope.aiMetrics;

              const handleProjectTypeChange = (
                event: ChangeEvent<HTMLSelectElement>,
              ) => {
                const nextType = event.target.value as ProjectType;
                setProjectTypes((prev) => ({
                  ...prev,
                  [initiative.id]: nextType,
                }));
              };

              const handleScopeSubmit = (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const summary = formData.get('summary')?.toString().trim();
                const deliverables = formData
                  .get('deliverables')
                  ?.toString()
                  .trim();

                const payload: Record<string, unknown> = {
                  projectType: selectedProjectType,
                };

                if (summary && summary !== scope.summary) {
                  payload.summary = summary;
                }

                if (deliverables && deliverables !== scope.deliverables) {
                  payload.deliverables = deliverables;
                }

                const dataMetricsPayload: Record<string, unknown> = {};
                const dataSources = parseIntField(formData.get('dataSources'));
                if (dataSources !== undefined) {
                  dataMetricsPayload.dataSources = dataSources;
                }
                const tables = parseIntField(formData.get('tables'));
                if (tables !== undefined) {
                  dataMetricsPayload.tables = tables;
                }
                const pipelines = parseIntField(formData.get('pipelines'));
                if (pipelines !== undefined) {
                  dataMetricsPayload.pipelines = pipelines;
                }
                const dashboards = parseIntField(formData.get('dashboards'));
                if (dashboards !== undefined) {
                  dataMetricsPayload.dashboards = dashboards;
                }
                const models = parseIntField(formData.get('models'));
                if (models !== undefined) {
                  dataMetricsPayload.models = models;
                }
                const volumeTb = parseFloatField(formData.get('volumeTb'));
                if (volumeTb !== undefined) {
                  dataMetricsPayload.volumeTb = volumeTb;
                }
                const complexity = formData.get('complexity')?.toString();
                if (complexity) {
                  dataMetricsPayload.complexity = complexity;
                }
                const sensitivity = formData.get('sensitivity')?.toString();
                if (sensitivity) {
                  dataMetricsPayload.sensitivity = sensitivity;
                }

                if (Object.keys(dataMetricsPayload).length > 0) {
                  payload.dataMetrics = dataMetricsPayload;
                }

                if (selectedProjectType !== 'DATA') {
                  const aiMetricsPayload: Record<string, unknown> = {};
                  const modelType = formData.get('modelType')
                    ?.toString()
                    .trim();
                  if (modelType) {
                    aiMetricsPayload.modelType = modelType;
                  }
                  const useCase = formData.get('useCase')?.toString().trim();
                  if (useCase) {
                    aiMetricsPayload.useCase = useCase;
                  }
                  const baselineAccuracy = parseFloatField(
                    formData.get('baselineAccuracy'),
                  );
                  if (baselineAccuracy !== undefined) {
                    aiMetricsPayload.baselineAccuracy = baselineAccuracy;
                  }
                  const targetAccuracy = parseFloatField(
                    formData.get('targetAccuracy'),
                  );
                  if (targetAccuracy !== undefined) {
                    aiMetricsPayload.targetAccuracy = targetAccuracy;
                  }
                  const trainingDataTb = parseFloatField(
                    formData.get('trainingDataTb'),
                  );
                  if (trainingDataTb !== undefined) {
                    aiMetricsPayload.trainingDataTb = trainingDataTb;
                  }
                  const featureCount = parseIntField(
                    formData.get('featureCount'),
                  );
                  if (featureCount !== undefined) {
                    aiMetricsPayload.featureCount = featureCount;
                  }
                  const trainingIterations = parseIntField(
                    formData.get('trainingIterations'),
                  );
                  if (trainingIterations !== undefined) {
                    aiMetricsPayload.trainingIterations = trainingIterations;
                  }
                  const deploymentStatus = formData
                    .get('deploymentStatus')
                    ?.toString();
                  if (deploymentStatus) {
                    aiMetricsPayload.deploymentStatus = deploymentStatus;
                  }
                  const monitoringKpis = formData
                    .get('monitoringKpis')
                    ?.toString()
                    .trim();
                  if (monitoringKpis) {
                    aiMetricsPayload.monitoringKpis = monitoringKpis;
                  }

                  if (Object.keys(aiMetricsPayload).length > 0) {
                    payload.aiMetrics = aiMetricsPayload;
                  }
                }

                mutation.mutate({
                  initiativeId: initiative.id,
                  data: payload,
                });
              };

              return (
                <article key={initiative.id} className="sow-card">
                  <header className="sow-card__header">
                    <div>
                      <h3>{initiative.name}</h3>
                      <p>{initiative.description}</p>
                    </div>
                    <span className={`sow-status sow-status--${scope.status.toLowerCase()}`}>
                      {SOW_STATUS_LABELS[scope.status]}
                    </span>
                  </header>
                  <form className="sow-card__form" onSubmit={handleScopeSubmit}>
                    <div className="sow-card__body sow-card__body--form">
                      <div className="form-row form-row--single">
                        <div className="form-group">
                          <label htmlFor={`summary-${initiative.id}`}>Summary</label>
                          <textarea
                            id={`summary-${initiative.id}`}
                            name="summary"
                            defaultValue={scope.summary}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="form-row form-row--single">
                        <div className="form-group">
                          <label htmlFor={`deliverables-${initiative.id}`}>
                            Deliverables
                          </label>
                          <textarea
                            id={`deliverables-${initiative.id}`}
                            name="deliverables"
                            defaultValue={scope.deliverables}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`projectType-${initiative.id}`}>
                            Project Type
                          </label>
                          <select
                            id={`projectType-${initiative.id}`}
                            name="projectType"
                            value={selectedProjectType}
                            onChange={handleProjectTypeChange}
                          >
                            {Object.entries(PROJECT_TYPE_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor={`dataSources-${initiative.id}`}>
                            # Data Sources
                          </label>
                          <input
                            id={`dataSources-${initiative.id}`}
                            name="dataSources"
                            type="number"
                            min="0"
                            defaultValue={dataMetrics?.dataSources ?? ''}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`tables-${initiative.id}`}>
                            # Tables / Entities
                          </label>
                          <input
                            id={`tables-${initiative.id}`}
                            name="tables"
                            type="number"
                            min="0"
                            defaultValue={dataMetrics?.tables ?? ''}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`pipelines-${initiative.id}`}>
                            # Pipelines / Jobs
                          </label>
                          <input
                            id={`pipelines-${initiative.id}`}
                            name="pipelines"
                            type="number"
                            min="0"
                            defaultValue={dataMetrics?.pipelines ?? ''}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`dashboards-${initiative.id}`}>
                            # Dashboards / Reports
                          </label>
                          <input
                            id={`dashboards-${initiative.id}`}
                            name="dashboards"
                            type="number"
                            min="0"
                            defaultValue={dataMetrics?.dashboards ?? ''}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`models-${initiative.id}`}>
                            # Models (Data)
                          </label>
                          <input
                            id={`models-${initiative.id}`}
                            name="models"
                            type="number"
                            min="0"
                            defaultValue={dataMetrics?.models ?? ''}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`volumeTb-${initiative.id}`}>
                            Volume (TB)
                          </label>
                          <input
                            id={`volumeTb-${initiative.id}`}
                            name="volumeTb"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={dataMetrics?.volumeTb ?? ''}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`complexity-${initiative.id}`}>
                            Complexity
                          </label>
                          <select
                            id={`complexity-${initiative.id}`}
                            name="complexity"
                            defaultValue={dataMetrics?.complexity ?? 'MEDIUM'}
                          >
                            {Object.entries(DATA_COMPLEXITY_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor={`sensitivity-${initiative.id}`}>
                            Sensitivity
                          </label>
                          <select
                            id={`sensitivity-${initiative.id}`}
                            name="sensitivity"
                            defaultValue={dataMetrics?.sensitivity ?? 'INTERNAL'}
                          >
                            {Object.entries(DATA_SENSITIVITY_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </div>
                      {selectedProjectType !== 'DATA' && (
                        <fieldset className="form-fieldset">
                          <legend>AI / ML Metrics</legend>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor={`modelType-${initiative.id}`}>
                                Model Type / Use Case
                              </label>
                              <input
                                id={`modelType-${initiative.id}`}
                                name="modelType"
                                defaultValue={aiMetrics?.modelType ?? ''}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`useCase-${initiative.id}`}>
                                Business Use Case
                              </label>
                              <input
                                id={`useCase-${initiative.id}`}
                                name="useCase"
                                defaultValue={aiMetrics?.useCase ?? ''}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`deploymentStatus-${initiative.id}`}>
                                Deployment Status
                              </label>
                              <select
                                id={`deploymentStatus-${initiative.id}`}
                                name="deploymentStatus"
                                defaultValue={aiMetrics?.deploymentStatus ?? 'IDEATION'}
                              >
                                {Object.entries(MODEL_DEPLOYMENT_STATUS_LABELS).map(
                                  ([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor={`baselineAccuracy-${initiative.id}`}>
                                Baseline Accuracy (%)
                              </label>
                              <input
                                id={`baselineAccuracy-${initiative.id}`}
                                name="baselineAccuracy"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                defaultValue={toPercentInput(
                                  aiMetrics?.baselineAccuracy ?? undefined,
                                )}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`targetAccuracy-${initiative.id}`}>
                                Target Accuracy (%)
                              </label>
                              <input
                                id={`targetAccuracy-${initiative.id}`}
                                name="targetAccuracy"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                defaultValue={toPercentInput(
                                  aiMetrics?.targetAccuracy ?? undefined,
                                )}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`trainingDataTb-${initiative.id}`}>
                                Training Data (TB)
                              </label>
                              <input
                                id={`trainingDataTb-${initiative.id}`}
                                name="trainingDataTb"
                                type="number"
                                min="0"
                                step="0.1"
                                defaultValue={aiMetrics?.trainingDataTb ?? ''}
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor={`featureCount-${initiative.id}`}>
                                # Features
                              </label>
                              <input
                                id={`featureCount-${initiative.id}`}
                                name="featureCount"
                                type="number"
                                min="0"
                                defaultValue={aiMetrics?.featureCount ?? ''}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`trainingIterations-${initiative.id}`}>
                                Training Iterations
                              </label>
                              <input
                                id={`trainingIterations-${initiative.id}`}
                                name="trainingIterations"
                                type="number"
                                min="0"
                                defaultValue={aiMetrics?.trainingIterations ?? ''}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor={`monitoringKpis-${initiative.id}`}>
                                Monitoring KPIs
                              </label>
                              <input
                                id={`monitoringKpis-${initiative.id}`}
                                name="monitoringKpis"
                                defaultValue={aiMetrics?.monitoringKpis ?? ''}
                              />
                            </div>
                          </div>
                        </fieldset>
                      )}
                    </div>
                    <footer className="sow-card__footer">
                      <div className="sow-card__approvals">
                        <div>
                          <span className="sow-chip-label">
                            {APPROVAL_ROLE_LABELS.PROJECT_MANAGER}
                          </span>
                          <button
                            type="button"
                            className={`chip-button ${
                              scope.pmApproved ? 'chip-button--active' : ''
                            }`}
                            disabled={mutation.isPending}
                            onClick={() =>
                              mutation.mutate({
                                initiativeId: initiative.id,
                                data: { pmApproved: !scope.pmApproved },
                              })
                            }
                          >
                            {scope.pmApproved ? 'Approved' : 'Pending'}
                          </button>
                        </div>
                        <div>
                          <span className="sow-chip-label">
                            {APPROVAL_ROLE_LABELS.DATA_ARCHITECT}
                          </span>
                          <button
                            type="button"
                            className={`chip-button ${
                              scope.architectApproved ? 'chip-button--active' : ''
                            }`}
                            disabled={mutation.isPending}
                            onClick={() =>
                              mutation.mutate({
                                initiativeId: initiative.id,
                                data: { architectApproved: !scope.architectApproved },
                              })
                            }
                          >
                            {scope.architectApproved ? 'Approved' : 'Pending'}
                          </button>
                        </div>
                      </div>
                      <div className="sow-card__actions sow-card__actions--stack">
                        <button
                          className="button"
                          type="submit"
                          disabled={mutation.isPending}
                        >
                          {mutation.isPending ? 'Saving…' : 'Save Scope'}
                        </button>
                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={!canSignOff || mutation.isPending}
                          onClick={() =>
                            mutation.mutate({
                              initiativeId: initiative.id,
                              data: { status: 'SIGNED_OFF' },
                            })
                          }
                        >
                          {canSignOff ? 'Sign Off Scope' : 'Awaiting approvals'}
                        </button>
                      </div>
                    </footer>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
