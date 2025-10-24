import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string | number;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    path: '/dashboard'
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderIcon,
    path: '/projects'
  },
  {
    id: 'team',
    label: 'Team',
    icon: UsersIcon,
    path: '/team'
  },
  {
    id: 'scope',
    label: 'Scope',
    icon: DocumentTextIcon,
    path: '/scope'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed: controlledCollapsed, 
  onToggle,
  className = ''
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Use controlled state if provided, otherwise use internal state
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={handleMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${collapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-gray-200 shadow-lg lg:shadow-none
          transition-all duration-300 ease-in-out
          flex flex-col
          ${className}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className={`p-4 border-b border-gray-200 ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  PilotGB
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  Control Tower
                </p>
              </div>
            )}
            
            {/* Desktop collapse toggle */}
            <button
              onClick={handleToggle}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive: linkActive }) => `
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-150 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${linkActive || isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon 
                  className={`
                    flex-shrink-0 h-5 w-5
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                    ${collapsed ? '' : 'mr-3'}
                  `}
                />
                
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-gray-200 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed && (
            <div className="text-xs text-gray-500">
              <p>Coordinate data initiatives</p>
              <p>Track delivery health</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};