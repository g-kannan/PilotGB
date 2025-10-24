import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route configuration for automatic breadcrumb generation
const routeConfig: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  '/dashboard': { label: 'Dashboard', icon: HomeIcon },
  '/projects': { label: 'Projects' },
  '/team': { label: 'Team' },
  '/scope': { label: 'Scope' }
};

// Generate breadcrumbs from current route
const generateBreadcrumbsFromRoute = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with home/dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon
  });

  // Build breadcrumbs from path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const config = routeConfig[currentPath];
    
    if (config && currentPath !== '/dashboard') {
      breadcrumbs.push({
        label: config.label,
        path: index === segments.length - 1 ? undefined : currentPath, // Last item has no link
        icon: config.icon
      });
    }
  });

  return breadcrumbs;
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items,
  className = '',
  showHome = true
}) => {
  const location = useLocation();
  
  // Use provided items or generate from route
  const breadcrumbItems = items || generateBreadcrumbsFromRoute(location.pathname);
  
  // Filter out home if showHome is false
  const displayItems = showHome ? breadcrumbItems : breadcrumbItems.slice(1);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center space-x-1 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const Icon = item.icon;
          
          return (
            <li key={`${item.path || item.label}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon 
                  className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" 
                  aria-hidden="true"
                />
              )}
              
              <div className="flex items-center">
                {Icon && (
                  <Icon className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                )}
                
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-150 truncate focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span 
                    className={`truncate ${
                      isLast 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-500'
                    }`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Hook for programmatically setting breadcrumbs
export const useBreadcrumbs = () => {
  const location = useLocation();
  
  const generateBreadcrumbs = (customItems?: BreadcrumbItem[]) => {
    return customItems || generateBreadcrumbsFromRoute(location.pathname);
  };

  return { generateBreadcrumbs };
};