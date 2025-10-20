import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchInitiatives, updateScope } from '../lib/api';
import {
  APPROVAL_ROLE_LABELS,
  SOW_STATUS_LABELS,
} from '../constants';
import type { Initiative, SOWStatus } from '../types';

const statusOrder: SOWStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'SIGNED_OFF'];

export const ScopeOfWorkPanel = () => {
  const queryClient = useQueryClient();

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
                  <div className="sow-card__body">
                    <div>
                      <strong>Summary</strong>
                      <p>{scope.summary}</p>
                    </div>
                    <div>
                      <strong>Deliverables</strong>
                      <p>{scope.deliverables}</p>
                    </div>
                  </div>
                  <footer className="sow-card__footer">
                    <div className="sow-card__approvals">
                      <div>
                        <span className="sow-chip-label">
                          {APPROVAL_ROLE_LABELS.PROJECT_MANAGER}
                        </span>
                        <button
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
                    <div className="sow-card__actions">
                      <button
                        className="button button--secondary"
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
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
