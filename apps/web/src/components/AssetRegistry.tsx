import { useQuery } from '@tanstack/react-query';
import { fetchAssets } from '../lib/api';
import { STAGE_LABELS } from '../constants';

export const AssetRegistry = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
    staleTime: 60_000,
  });

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Data Asset Registry</h2>
          <p>Trace deliverables, ownership, and acceptance criteria.</p>
        </div>
      </header>
      <div className="panel__body">
        {isLoading && <p>Loading assets…</p>}
        {isError && (
          <p className="panel__body--error">
            {error instanceof Error ? error.message : 'Failed to load assets.'}
          </p>
        )}
        {!isLoading && !isError && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Initiative</th>
                  <th>Stage</th>
                  <th>Owner Team</th>
                  <th>Acceptance Criteria</th>
                </tr>
              </thead>
              <tbody>
                {data?.assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <strong>{asset.name}</strong>
                    </td>
                    <td>{asset.type}</td>
                    <td>{asset.initiative?.name ?? '—'}</td>
                    <td>
                      {asset.initiative
                        ? STAGE_LABELS[asset.initiative.stage]
                        : '—'}
                    </td>
                    <td>{asset.ownerTeam}</td>
                    <td>{asset.acceptanceCriteria ?? '—'}</td>
                  </tr>
                ))}
                {!data?.assets.length && (
                  <tr>
                    <td colSpan={6} className="table__empty">
                      No assets registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
