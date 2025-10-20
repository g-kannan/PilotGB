import { TeamOnboarding } from '../components/TeamOnboarding';

export const TeamPage = () => {
  return (
    <div className="page">
      <div className="page__header">
        <h1>Team Management</h1>
        <p>Add team members, assign them to projects, and track onboarding progress.</p>
      </div>
      <div className="page__content">
        <TeamOnboarding />
      </div>
    </div>
  );
};