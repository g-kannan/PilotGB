import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/ui';
import { ProjectsPage, TeamPage, ScopePage, DashboardPage } from './pages';
import './styles.css';

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/scope" element={<ScopePage />} />
        </Routes>
      </Layout>
      <ReactQueryDevtools initialIsOpen={false} />
    </Router>
  </QueryClientProvider>
);
