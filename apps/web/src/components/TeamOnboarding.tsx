import { FormEvent, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchInitiatives,
  fetchTeamMembers,
  createTeamMember,
  assignTeamMember,
  removeTeamMember,
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
  TeamMember,
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

  const membersQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: fetchTeamMembers,
    staleTime: 60_000,
  });

  const teamMembers = membersQuery.data?.members ?? [];

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

  const createMemberMutation = useMutation<
    unknown,
    Error,
    {
      name: string;
      email: string;
      roleTitle: string;
      team: string;
      startDate?: string;
    }
  >({
    mutationFn: (payload) => createTeamMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const assignMemberMutation = useMutation<
    unknown,
    Error,
    {
      initiativeId: string;
      memberId: string;
      responsibility: string;
    }
  >({
    mutationFn: ({ initiativeId, memberId, responsibility }) =>
      assignTeamMember(initiativeId, {
        memberId,
        responsibility,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  const removeAssignmentMutation = useMutation<
    unknown,
    Error,
    { initiativeId: string; memberId: string }
  >({
    mutationFn: ({ initiativeId, memberId }) =>
      removeTeamMember(initiativeId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });

  const mutationError =
    onboardingMutation.error ||
    accessMutation.error ||
    createMemberMutation.error ||
    assignMemberMutation.error ||
    removeAssignmentMutation.error;

  const handleCreateMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const roleTitle = formData.get('roleTitle')?.toString().trim();
    const team = formData.get('team')?.toString().trim();
    const startDate = formData.get('startDate')?.toString().trim();

    if (!name || !email || !roleTitle || !team) {
      return;
    }

    createMemberMutation.mutate(
      {
        name,
        email,
        roleTitle,
        team,
        startDate: startDate || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
        },
      },
    );
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Team Onboarding</h2>
          <p>Track staffing, access provisioning, and project readiness.</p>
        </div>
        {mutationError && (
          <div className="alert alert--error">
            <strong>Update failed:</strong>{' '}
            {mutationError instanceof Error
              ? mutationError.message
              : 'Unexpected error'}
          </div>
        )}
      </header>
      <div className="panel__body">
        {isLoading && <p>Loading onboarding data--</p>}
        {isError && (
          <p className="panel__body--error">
            {error instanceof Error
              ? error.message
              : 'Unable to load team onboarding information.'}
          </p>
        )}
        {membersQuery.isError && (
          <p className="panel__body--error">
            {membersQuery.error instanceof Error
              ? membersQuery.error.message
              : 'Unable to load team directory.'}
          </p>
        )}
        {!isLoading && !isError && data && (
          <>
            <div className="panel__subsection">
              <h3>Create Team Member</h3>
              <form className="inline-form" onSubmit={handleCreateMember}>
                <input name="name" placeholder="Name" required />
                <input name="email" type="email" placeholder="Email" required />
                <input name="roleTitle" placeholder="Role Title" required />
                <input name="team" placeholder="Team" required />
                <input name="startDate" type="date" />
                <button
                  className="button"
                  type="submit"
                  disabled={createMemberMutation.isPending}
                >
                  {createMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                </button>
              </form>
            </div>
            <div className="onboarding-grid">
              {data.initiatives.map((initiative) => {
              const assignedMemberIds = new Set(
                initiative.assignments.map((assignment) => assignment.member.id),
              );
              const availableMembers = teamMembers.filter(
                (member) => !assignedMemberIds.has(member.id),
              );
              const assignPending =
                assignMemberMutation.isPending &&
                assignMemberMutation.variables?.initiativeId === initiative.id;
              const removingMemberId =
                removeAssignmentMutation.isPending &&
                removeAssignmentMutation.variables?.initiativeId === initiative.id
                  ? removeAssignmentMutation.variables.memberId
                  : undefined;

              const handleAssignMember = (
                event: FormEvent<HTMLFormElement>,
              ) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const memberId = formData.get('memberId')?.toString();
                const responsibility = formData
                  .get('responsibility')
                  ?.toString()
                  .trim();

                if (!memberId || !responsibility) {
                  return;
                }

                assignMemberMutation.mutate(
                  {
                    initiativeId: initiative.id,
                    memberId,
                    responsibility,
                  },
                  {
                    onSuccess: () => {
                      event.currentTarget.reset();
                    },
                  },
                );
              };

              return (
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
                        <th>Actions</th>
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
                          <td>
                            <button
                              type="button"
                              className="button button--ghost"
                              disabled={removingMemberId === assignment.member.id}
                              onClick={() =>
                                removeAssignmentMutation.mutate({
                                  initiativeId: initiative.id,
                                  memberId: assignment.member.id,
                                })
                              }
                            >
                              {removingMemberId === assignment.member.id
                                ? 'Removing...'
                                : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!initiative.assignments.length && (
                        <tr>
                          <td colSpan={5} className="table__empty">
                            No team members assigned yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {availableMembers.length > 0 ? (
                    <form
                      className="inline-form"
                      onSubmit={handleAssignMember}
                    >
                      <select
                        name="memberId"
                        defaultValue=""
                        required
                        disabled={assignPending || membersQuery.isLoading}
                      >
                        <option value="" disabled>
                          Select team member
                        </option>
                        {availableMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} - {member.team}
                          </option>
                        ))}
                      </select>
                      <input
                        name="responsibility"
                        placeholder="Responsibility"
                        required
                      />
                      <button
                        className="button"
                        type="submit"
                        disabled={assignPending || membersQuery.isLoading}
                      >
                        {assignPending ? 'Assigning...' : 'Assign'}
                      </button>
                    </form>
                  ) : (
                    <p className="table__empty">
                      {teamMembers.length === 0
                        ? 'Add team members to assign.'
                        : 'All available members are assigned.'}
                    </p>
                  )}
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
                          <td>{access.notes ?? '-'}</td>
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
              );
            })}
          </div>
        </>
      )}
      </div>
    </section>
  );
};
