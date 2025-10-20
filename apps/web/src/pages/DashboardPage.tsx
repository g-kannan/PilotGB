import { DeliveryHealth } from '../components/DeliveryHealth';
import { AssetRegistry } from '../components/AssetRegistry';

export const DashboardPage = () => {
  return (
    <div className="page">
      <div className="page__header">
        <h1>Dashboard</h1>
        <p>Monitor delivery health and track project assets.</p>
      </div>
      <div className="page__content">
        <div className="layout__grid layout__grid--balanced">
          <DeliveryHealth />
          <AssetRegistry />
        </div>
      </div>
    </div>
  );
};