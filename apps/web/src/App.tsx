import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LifecycleBoard } from './components/LifecycleBoard';
import { CreateInitiativeForm } from './components/CreateInitiativeForm';
import { AssetRegistry } from './components/AssetRegistry';
import { DeliveryHealth } from './components/DeliveryHealth';
import { ScopeOfWorkPanel } from './components/ScopeOfWorkPanel';
import { TeamOnboarding } from './components/TeamOnboarding';
import './styles.css';

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <div className="layout">
      <header className="layout__header">
        <div>
          <h1>PilotGB Control Tower</h1>
          <p>
            Coordinate data initiatives, safeguard scope, and track delivery health.
          </p>
        </div>
      </header>
      <main className="layout__main">
        <CreateInitiativeForm />
        <LifecycleBoard />
        <div className="layout__grid layout__grid--balanced">
          <ScopeOfWorkPanel />
          <DeliveryHealth />
        </div>
        <div className="layout__grid layout__grid--balanced">
          <AssetRegistry />
          <TeamOnboarding />
        </div>
      </main>
    </div>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
