import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Subscription } from '@/types';
import { ToastContainer } from '@/components/ui/Toast';

// Layout
import { Sidebar } from '@/components/layout/Sidebar';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';
import { SubscriptionFormPage } from '@/pages/SubscriptionFormPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PriceMonitorPage } from '@/pages/PriceMonitorPage';

type Page = 'dashboard' | 'subscriptions' | 'subscription-form' | 'price-monitor' | 'alerts' | 'reports' | 'users' | 'settings';

function App() {
  const { isAuthenticated, sidebarOpen, toasts, removeToast } = useStore();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated]);

  const navigate = (page: string) => {
    setCurrentPage(page as Page);
    setEditingSubscription(null);
  };

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSubscription(sub);
    setCurrentPage('subscription-form');
  };

  const handleNewSubscription = () => {
    setEditingSubscription(null);
    setCurrentPage('subscription-form');
  };

  const handleBackFromForm = () => {
    setEditingSubscription(null);
    setCurrentPage('subscriptions');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'subscriptions':
        return (
          <SubscriptionsPage
            onNavigate={navigate}
            onEdit={handleEditSubscription}
            onNew={handleNewSubscription}
          />
        );
      case 'subscription-form':
        return (
          <SubscriptionFormPage
            subscription={editingSubscription}
            onNavigate={navigate}
            onBack={handleBackFromForm}
          />
        );
      case 'price-monitor':
        return <PriceMonitorPage onNavigate={navigate} />;
      case 'alerts':
        return <AlertsPage onNavigate={navigate} />;
      case 'reports':
        return <ReportsPage onNavigate={navigate} />;
      case 'users':
        return <UsersPage onNavigate={navigate} />;
      case 'settings':
        return <SettingsPage onNavigate={navigate} />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed */}
      <Sidebar
        currentPage={currentPage === 'subscription-form' ? 'subscriptions' : currentPage}
        onNavigate={navigate}
      />
      
      {/* Main content - Scrollable */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
        {renderPage()}
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
