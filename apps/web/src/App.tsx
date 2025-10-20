import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ProjectsPage, TeamPage, ScopePage, DashboardPage } from './pages';
import './styles.css';

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <div className="layout">
        <header className="layout__header">
          <Navigation />
        </header>
        <main className="layout__main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/scope" element={<ScopePage />} />
          </Routes>
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </Router>
  </QueryClientProvider>
);
