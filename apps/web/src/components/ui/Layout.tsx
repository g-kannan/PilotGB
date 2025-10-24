import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BreadcrumbItem } from './Breadcrumb';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  headerActions?: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  showSearch?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  headerActions,
  showSearch = true,
  className = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />

      {/* Main content area */}
      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          actions={headerActions}
          showSearch={showSearch}
        />

        {/* Page content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};