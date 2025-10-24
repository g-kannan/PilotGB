import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { Button } from './Button';

interface HeaderAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: HeaderAction[];
  breadcrumbs?: BreadcrumbItem[];
  showSearch?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions = [],
  breadcrumbs,
  showSearch = true,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  const userMenuItems = [
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
    { id: 'logout', label: 'Sign out', icon: ArrowRightOnRectangleIcon }
  ];

  return (
    <header className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Top section with search and user menu */}
        <div className="flex items-center justify-between h-16">
          {/* Left section - Title or breadcrumbs */}
          <div className="flex-1 min-w-0">
            {breadcrumbs ? (
              <Breadcrumb items={breadcrumbs} />
            ) : title ? (
              <div>
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            ) : (
              <Breadcrumb />
            )}
          </div>

          {/* Right section - Search, notifications, user menu */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <form onSubmit={handleSearchSubmit} className="hidden sm:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </form>
            )}

            {/* Notifications */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              aria-label="View notifications"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <UserCircleIcon className="h-6 w-6" />
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              // TODO: Handle menu item clicks
                              console.log('User menu item clicked:', item.id);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                          >
                            <Icon className="h-4 w-4 mr-3 text-gray-400" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom section with actions */}
        {(actions.length > 0 || title || subtitle) && (
          <div className="flex items-center justify-between py-4 border-t border-gray-100">
            {/* Title and subtitle if not using breadcrumbs */}
            {!breadcrumbs && (title || subtitle) && (
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="flex items-center space-x-3">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant={action.variant || 'primary'}
                      onClick={action.onClick}
                      className="flex items-center space-x-2"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};