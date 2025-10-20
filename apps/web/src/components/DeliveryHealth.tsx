import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '../lib/api';
import { STAGE_LABELS } from '../constants';

export const DeliveryHealth = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 60_000,
  });

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Delivery Health</h2>
          <p>Lifecycle throughput, risks, and dependency hotspots.</p>
        </div>
      </header>
      <div className="panel__body">
        {isLoading && <p>Loading metrics…</p>}
        {isError && (
          <p className="panel__body--error">
            {error instanceof Error ? error.message : 'Failed to load metrics.'}
          </p>
        )}
        {!isLoading && !isError && data && (
          <>
            <div className="metrics">
              <div className="metrics__group">
                <h3>Lifecycle Distribution</h3>
                <ul className="metrics__list">
                  {Object.entries(data.metrics.byStage).map(
                    ([stage, value]) => (
                      <li key={stage}>
                        <span>{STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}</span>
                        <strong>{value}</strong>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div className="metrics__group">
                <h3>Status Mix</h3>
                <ul className="metrics__list">
                  {Object.entries(data.metrics.byStatus).map(
                    ([status, value]) => (
                      <li key={status}>
                        <span>{status.split('_').join(' ')}</span>
                        <strong>{value}</strong>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div className="metrics__group">
                <h3>Health Checks</h3>
                <ul className="metrics__list">
                  {Object.entries(data.metrics.health).map(
                    ([healthStatus, value]) => (
                      <li key={healthStatus}>
                        <span>{healthStatus}</span>
                        <strong>{value}</strong>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
            <div className="metrics metrics--secondary">
              <div className="metrics__highlight">
                <h4>Blocked Dependencies</h4>
                <strong>{data.metrics.blockedDependencies}</strong>
              </div>
              <div className="metrics__highlight">
                <h4>Overdue Initiatives</h4>
                <strong>{data.metrics.overdueInitiatives}</strong>
              </div>
              <div className="metrics__highlight">
                <h4>Avg Cycle Time</h4>
                <strong>
                  {data.metrics.averageCycleTimeDays
                    ? `${data.metrics.averageCycleTimeDays} days`
                    : 'Not enough data'}
                </strong>
              </div>
            </div>
            <div className="panel__subsection">
              <h3>High-Severity Risks</h3>
              {data.metrics.riskHotspots.length === 0 ? (
                <p>No high-severity risks open.</p>
              ) : (
                <ul className="risk-list">
                  {data.metrics.riskHotspots.map((risk) => (
                    <li key={risk.riskId}>
                      <div>
                        <strong>{risk.riskTitle}</strong>
                        <p>{risk.initiativeName}</p>
                      </div>
                      <span className="chip">Severity: {risk.severity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
