import { ScopeOfWorkPanel } from '../components/ScopeOfWorkPanel';

export const ScopePage = () => {
  return (
    <div className="page">
      <div className="page__header">
        <h1>Scope Management</h1>
        <p>Define and track project scope, deliverables, and requirements.</p>
      </div>
      <div className="page__content">
        <ScopeOfWorkPanel />
      </div>
    </div>
  );
};