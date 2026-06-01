import React from 'react';
import {
  LayoutDashboard, CreditCard, Bell, FileText, Users,
  Settings, LogOut, ChevronLeft, ChevronRight, Radar
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useStore } from '@/store/useStore';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'price-monitor', label: 'Price Monitor', icon: Radar },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'users', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { sidebarOpen, toggleSidebar, logout, alerts, currentUser, priceMonitors } = useStore();
  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed).length;
  const priceChanges = priceMonitors.filter(pm => pm.status === 'increased' || pm.status === 'decreased').length;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-[68px]',
        'lg:relative lg:z-auto',
        !sidebarOpen && 'max-lg:-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <img src="/logo.png" alt="Subscripto" className="w-9 h-9 rounded-xl flex-shrink-0" />
          {sidebarOpen && (
            <span className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">Subscripto</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            if (item.id === 'users' && currentUser?.role === 'viewer') return null;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <div className="relative flex-shrink-0 flex items-center justify-center">
                  <item.icon size={20} />
                  {!sidebarOpen && item.id === 'price-monitor' && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-1 py-px rounded-[4px] bg-gradient-to-r from-primary-500 to-indigo-500 text-white text-[8px] font-black tracking-wider shadow-sm leading-none border border-white">
                      TEST
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <span className="flex-1 text-left flex items-center gap-2">
                    {item.label}
                    {item.id === 'price-monitor' && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gradient-to-r from-primary-100 to-indigo-100 text-primary-700 tracking-wider leading-none">
                        TEST
                      </span>
                    )}
                  </span>
                )}
                {item.id === 'alerts' && unreadAlerts > 0 && sidebarOpen && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-danger-100 text-danger-600">
                    {unreadAlerts}
                  </span>
                )}
                {item.id === 'alerts' && unreadAlerts > 0 && !sidebarOpen && (
                  <span className="absolute right-2 top-1 w-2 h-2 rounded-full bg-danger-500" />
                )}
                {item.id === 'price-monitor' && priceChanges > 0 && sidebarOpen && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-100 text-warning-700">
                    {priceChanges}
                  </span>
                )}
                {item.id === 'price-monitor' && priceChanges > 0 && !sidebarOpen && (
                  <span className="absolute right-2 top-1 w-2 h-2 rounded-full bg-warning-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User & Collapse */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-2 flex-shrink-0">
          {sidebarOpen && currentUser && (
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
          <button
            onClick={toggleSidebar}
            className="w-full hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
