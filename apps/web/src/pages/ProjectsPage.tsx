import { CreateInitiativeForm } from '../components/CreateInitiativeForm';
import { LifecycleBoard } from '../components/LifecycleBoard';

export const ProjectsPage = () => {
  return (
    <div className="page">
      <div className="page__header">
        <h1>Projects</h1>
        <p>Create new initiatives and manage their lifecycle.</p>
      </div>
      <div className="page__content">
        <CreateInitiativeForm />
        <LifecycleBoard />
      </div>
    </div>
  );
};