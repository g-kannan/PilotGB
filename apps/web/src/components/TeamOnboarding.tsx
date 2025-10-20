import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchInitiatives,
  updateAccessProvision,
  updateTeamMemberOnboarding,
} from '../lib/api';
import {
  ACCESS_STATUS_LABELS,
  ONBOARDING_STATUS_LABELS,
} from '../constants';
import type {
  AccessStatus,
  Initiative,
  OnboardingStatus,
} from '../types';

const onboardingOptions = Object.entries(ONBOARDING_STATUS_LABELS);
const accessOptions = Object.entries(ACCESS_STATUS_LABELS);

export const TeamOnboarding = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['initiatives'],
    queryFn: fetchInitiatives,
    staleTime: 30_000,
  });

  const onboardingMutation = useMutation<
    unknown,
    Error,
    {
      initiativeId: string;
      memberId: string;
      onboardingStatus: OnboardingStatus;
      startDate?: string;
    }
  >({
    mutationFn: ({ initiativeId, memberId, onboardingStatus, startDate }) =>
      updateTeamMemberOnboarding(initiativeId, memberId, {
        onboardingStatus,
        startDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  const accessMutation = useMutation<
    unknown,
    Error,
    {
      initiativeId: string;
      accessId: string;
      status: AccessStatus;
    }
  >({
    mutationFn: ({ initiativeId, accessId, status }) =>
      updateAccessProvision(initiativeId, accessId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Team Onboarding</h2>
          <p>Track staffing, access provisioning, and project readiness.</p>
        </div>
        {(onboardingMutation.error || accessMutation.error) && (
          <div className="alert alert--error">
            <strong>Update failed:</strong>{' '}
            {onboardingMutation.error instanceof Error
              ? onboardingMutation.error.message
              : accessMutation.error instanceof Error
              ? accessMutation.error.message
              : 'Unexpected error'}
          </div>
        )}
      </header>
      <div className="panel__body">
        {isLoading && <p>Loading onboarding data�?�</p>}
        {isError && (
          <p className="panel__body--error">
            {error instanceof Error
              ? error.message
              : 'Unable to load team onboarding information.'}
          </p>
        )}
        {!isLoading && !isError && data && (
          <div className="onboarding-grid">
            {data.initiatives.map((initiative: Initiative) => (
              <article key={initiative.id} className="onboarding-card">
                <header className="onboarding-card__header">
                  <div>
                    <h3>{initiative.name}</h3>
                    <p>{initiative.description}</p>
                  </div>
                </header>
                <div className="onboarding-card__section">
                  <h4>Assignments</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Team</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initiative.assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <strong>{assignment.member.name}</strong>
                          </td>
                          <td>{assignment.responsibility}</td>
                          <td>{assignment.member.team}</td>
                          <td>
                            <select
                              value={assignment.member.onboardingStatus}
                              disabled={onboardingMutation.isPending}
                              onChange={(event) =>
                                onboardingMutation.mutate({
                                  initiativeId: initiative.id,
                                  memberId: assignment.member.id,
                                  onboardingStatus:
                                    event.target.value as OnboardingStatus,
                                })
                              }
                            >
                              {onboardingOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="onboarding-card__section">
                  <h4>Access Provisioning</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>System</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initiative.accessRequests.map((access) => (
                        <tr key={access.id}>
                          <td>{access.member.name}</td>
                          <td>{access.systemName}</td>
                          <td>
                            <select
                              value={access.status}
                              disabled={accessMutation.isPending}
                              onChange={(event) =>
                                accessMutation.mutate({
                                  initiativeId: initiative.id,
                                  accessId: access.id,
                                  status: event.target.value as AccessStatus,
                                })
                              }
                            >
                              {accessOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{access.notes ?? '—'}</td>
                        </tr>
                      ))}
                      {!initiative.accessRequests.length && (
                        <tr>
                          <td colSpan={4} className="table__empty">
                            No access requests recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
