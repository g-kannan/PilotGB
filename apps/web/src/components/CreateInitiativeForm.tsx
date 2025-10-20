import { useState } from 'react';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createInitiative,
} from '../lib/api';
import {
  PROJECT_TYPE_LABELS,
  DATA_COMPLEXITY_LABELS,
  DATA_SENSITIVITY_LABELS,
  MODEL_DEPLOYMENT_STATUS_LABELS,
} from '../constants';
import type {
  ProjectType,
  DataComplexity,
  DataSensitivity,
} from '../types';

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

export const CreateInitiativeForm = () => {
  const queryClient = useQueryClient();
  const [projectType, setProjectType] = useState<ProjectType>('DATA');
  const [formKey, setFormKey] = useState(0);

  const mutation = useMutation({
    mutationFn: createInitiative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setFormKey((key) => key + 1);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const name = form.get('name')?.toString().trim();
    const description = form.get('description')?.toString().trim();

    if (!name || !description) {
      return;
    }

    const scopeSummary =
      form.get('scopeSummary')?.toString().trim() ??
      'Scope definition pending.';
    const scopeDeliverables =
      form.get('scopeDeliverables')?.toString().trim() ??
      'Deliverables to be defined.';

    const dataMetricsInput = {
      dataSources: parseIntField(form.get('dataSources')),
      tables: parseIntField(form.get('tables')),
      pipelines: parseIntField(form.get('pipelines')),
      dashboards: parseIntField(form.get('dashboards')),
      models: parseIntField(form.get('models')),
      volumeTb: parseFloatField(form.get('volumeTb')),
      complexity: form.get('complexity') as DataComplexity | null,
      sensitivity: form.get('sensitivity') as DataSensitivity | null,
    };

    const aiMetricsInput = {
      modelType: form.get('modelType')?.toString().trim() || undefined,
      useCase: form.get('useCase')?.toString().trim() || undefined,
      baselineAccuracy: parseFloatField(form.get('baselineAccuracy')),
      targetAccuracy: parseFloatField(form.get('targetAccuracy')),
      trainingDataTb: parseFloatField(form.get('trainingDataTb')),
      featureCount: parseIntField(form.get('featureCount')),
      trainingIterations: parseIntField(form.get('trainingIterations')),
      deploymentStatus: form.get('deploymentStatus')?.toString(),
      monitoringKpis:
        form.get('monitoringKpis')?.toString().trim() || undefined,
    };

    const dataMetrics = Object.entries(dataMetricsInput).reduce<
      Record<string, unknown>
    >((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const aiMetrics =
      projectType === 'DATA'
        ? undefined
        : Object.entries(aiMetricsInput).reduce<Record<string, unknown>>(
            (acc, [key, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
              }
              return acc;
            },
            {},
          );

    const payload: Record<string, unknown> = {
      name,
      description,
      sowReference: form.get('sowReference')?.toString().trim() || undefined,
      engagementLead:
        form.get('engagementLead')?.toString().trim() || undefined,
      projectManager:
        form.get('projectManager')?.toString().trim() || undefined,
      dataArchitect:
        form.get('dataArchitect')?.toString().trim() || undefined,
      startDate: form.get('startDate')?.toString() || undefined,
      targetDate: form.get('targetDate')?.toString() || undefined,
      scope: {
        summary: scopeSummary,
        deliverables: scopeDeliverables,
        projectType,
        ...(Object.keys(dataMetrics).length > 0
          ? { dataMetrics }
          : undefined),
        ...(aiMetrics && Object.keys(aiMetrics).length > 0
          ? { aiMetrics }
          : undefined),
      },
    };

    mutation.mutate(payload);
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>New Project</h2>
          <p>Onboard a project with scope, owners, and delivery attributes.</p>
        </div>
        {mutation.isError && (
          <div className="alert alert--error">
            <strong>Creation failed:</strong>{' '}
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Unexpected error'}
          </div>
        )}
      </header>
      <div className="panel__body">
        <form
          key={formKey}
          className="form-grid"
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Project Name</label>
              <input id="name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="sowReference">SOW Reference</label>
              <input id="sowReference" name="sowReference" />
            </div>
          </div>
          <div className="form-row form-row--single">
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="projectManager">Project Manager</label>
              <input id="projectManager" name="projectManager" />
            </div>
            <div className="form-group">
              <label htmlFor="dataArchitect">Data Architect</label>
              <input id="dataArchitect" name="dataArchitect" />
            </div>
            <div className="form-group">
              <label htmlFor="engagementLead">Engagement Lead</label>
              <input id="engagementLead" name="engagementLead" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input id="startDate" name="startDate" type="date" />
            </div>
            <div className="form-group">
              <label htmlFor="targetDate">Target Date</label>
              <input id="targetDate" name="targetDate" type="date" />
            </div>
            <div className="form-group">
              <label htmlFor="projectType">Project Type</label>
              <select
                id="projectType"
                name="projectType"
                value={projectType}
                onChange={(event) =>
                  setProjectType(event.target.value as ProjectType)
                }
              >
                {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row form-row--single">
            <div className="form-group">
              <label htmlFor="scopeSummary">Scope Summary</label>
              <textarea
                id="scopeSummary"
                name="scopeSummary"
                rows={2}
              />
            </div>
          </div>
          <div className="form-row form-row--single">
            <div className="form-group">
              <label htmlFor="scopeDeliverables">Key Deliverables</label>
              <textarea
                id="scopeDeliverables"
                name="scopeDeliverables"
                rows={2}
              />
            </div>
          </div>
          <fieldset className="form-fieldset">
            <legend>Data Scope</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dataSources"># Data Sources</label>
                <input id="dataSources" name="dataSources" type="number" min="0" />
              </div>
              <div className="form-group">
                <label htmlFor="tables"># Tables / Entities</label>
                <input id="tables" name="tables" type="number" min="0" />
              </div>
              <div className="form-group">
                <label htmlFor="pipelines"># Pipelines / Jobs</label>
                <input id="pipelines" name="pipelines" type="number" min="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dashboards"># Dashboards / Reports</label>
                <input id="dashboards" name="dashboards" type="number" min="0" />
              </div>
              <div className="form-group">
                <label htmlFor="models"># Models (Data)</label>
                <input id="models" name="models" type="number" min="0" />
              </div>
              <div className="form-group">
                <label htmlFor="volumeTb">Volume (TB)</label>
                <input id="volumeTb" name="volumeTb" type="number" min="0" step="0.01" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="complexity">Complexity</label>
                <select id="complexity" name="complexity" defaultValue="MEDIUM">
                  {Object.entries(DATA_COMPLEXITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="sensitivity">Sensitivity</label>
                <select id="sensitivity" name="sensitivity" defaultValue="INTERNAL">
                  {Object.entries(DATA_SENSITIVITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
          {projectType !== 'DATA' && (
            <fieldset className="form-fieldset">
              <legend>AI / ML Scope</legend>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modelType">Model Type / Use Case</label>
                  <input id="modelType" name="modelType" />
                </div>
                <div className="form-group">
                  <label htmlFor="useCase">Business Use Case</label>
                  <input id="useCase" name="useCase" />
                </div>
                <div className="form-group">
                  <label htmlFor="deploymentStatus">Deployment Status</label>
                  <select
                    id="deploymentStatus"
                    name="deploymentStatus"
                    defaultValue="IDEATION"
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
                  <label htmlFor="baselineAccuracy">Baseline Accuracy (%)</label>
                  <input
                    id="baselineAccuracy"
                    name="baselineAccuracy"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="targetAccuracy">Target Accuracy (%)</label>
                  <input
                    id="targetAccuracy"
                    name="targetAccuracy"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="trainingDataTb">Training Data (TB)</label>
                  <input
                    id="trainingDataTb"
                    name="trainingDataTb"
                    type="number"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="featureCount"># Features</label>
                  <input id="featureCount" name="featureCount" type="number" min="0" />
                </div>
                <div className="form-group">
                  <label htmlFor="trainingIterations">Training Iterations</label>
                  <input id="trainingIterations" name="trainingIterations" type="number" min="0" />
                </div>
                <div className="form-group">
                  <label htmlFor="monitoringKpis">Monitoring KPIs</label>
                  <input id="monitoringKpis" name="monitoringKpis" />
                </div>
              </div>
            </fieldset>
          )}
          <div className="form-actions">
            <button
              className="button"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
