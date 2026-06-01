import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, AlertTriangle, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/cn';
import { AlertType } from '@/types';

interface AlertsPageProps {
  onNavigate: (page: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const { alerts, markAlertRead, markAllAlertsRead, dismissAlert } = useStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'renewal' | 'budget' | 'expired'>('all');

  const filtered = alerts.filter(a => {
    if (a.dismissed) return false;
    switch (filter) {
      case 'unread': return !a.read;
      case 'renewal': return a.type === 'renewal';
      case 'budget': return a.type === 'budget_warning';
      case 'expired': return a.type === 'expired_active';
      default: return true;
    }
  });

  const unreadCount = alerts.filter(a => !a.read && !a.dismissed).length;

  const alertIcon = (type: AlertType) => {
    switch (type) {
      case 'renewal': return <Clock size={18} />;
      case 'budget_warning': return <DollarSign size={18} />;
      case 'expired_active': return <AlertTriangle size={18} />;
      case 'price_change': return <DollarSign size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const alertColor = (type: AlertType) => {
    switch (type) {
      case 'renewal': return 'bg-blue-100 text-blue-600';
      case 'budget_warning': return 'bg-warning-100 text-warning-600';
      case 'expired_active': return 'bg-danger-100 text-danger-600';
      case 'price_change': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title="Alerts & Notifications"
        subtitle={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
        onNavigate={onNavigate}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAllAlertsRead} icon={<CheckCheck size={14} />} className="ml-2">
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', count: alerts.filter(a => !a.dismissed).length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'renewal', label: 'Renewals', count: alerts.filter(a => !a.dismissed && a.type === 'renewal').length },
            { key: 'expired', label: 'Expired', count: alerts.filter(a => !a.dismissed && a.type === 'expired_active').length },
            { key: 'budget', label: 'Budget', count: alerts.filter(a => !a.dismissed && a.type === 'budget_warning').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                filter === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  filter === tab.key ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Bell size={28} />}
              title={filter === 'all' ? 'No alerts' : `No ${filter} alerts`}
              description="You're all caught up! We'll notify you when something needs your attention."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(alert => (
              <Card
                key={alert.id}
                padding="none"
                className={cn(
                  'animate-fade-in transition-all',
                  !alert.read && 'ring-1 ring-primary-200 bg-primary-50/30'
                )}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', alertColor(alert.type))}>
                    {alertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </span>
                          {alert.subscriptionName && (
                            <Badge variant="neutral">{alert.subscriptionName}</Badge>
                          )}
                          <Badge variant={
                            alert.priority === 'critical' ? 'danger' :
                            alert.priority === 'high' ? 'warning' :
                            alert.priority === 'medium' ? 'info' : 'neutral'
                          }>
                            {alert.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!alert.read && (
                          <button
                            onClick={() => markAlertRead(alert.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                          title="Dismiss"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Email notification settings preview */}
        <Card className="mt-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Notification Preferences</h4>
              <p className="text-sm text-gray-500 mt-1">
                Email alerts are sent automatically for renewals at 30, 15, 7, and 3 days before due date.
                Slack integration coming soon.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="success" dot>Email: Active</Badge>
                <Badge variant="neutral" dot>Slack: Coming Soon</Badge>
                <Badge variant="neutral" dot>Webhook: Coming Soon</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
