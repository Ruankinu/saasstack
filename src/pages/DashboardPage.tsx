import React from 'react';
import {
  DollarSign, CreditCard, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, CalendarClock, Users, BarChart3, Radar,
  Plus, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import { format, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/utils/cn';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    getMetrics, getSpendByCategory, getMonthlySpend,
    getUpcomingRenewals, alerts, organization, currentUser, getPriceChanges
  } = useStore();

  const metrics = getMetrics();
  const spendByCategory = getSpendByCategory();
  const monthlySpend = getMonthlySpend();
  const upcomingRenewals = getUpcomingRenewals();
  const recentAlerts = alerts.filter(a => !a.dismissed).slice(0, 4);
  const priceChanges = getPriceChanges();

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statCards = [
    {
      title: 'Monthly Spend',
      value: formatCurrency(metrics.totalMonthlySpend),
      subtitle: `of ${formatCurrency(metrics.monthlyBudget)} budget`,
      icon: DollarSign,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      trend: '+3.2%',
      trendUp: true,
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubscriptions.toString(),
      subtitle: `${metrics.cancelledSubscriptions} cancelled`,
      icon: CreditCard,
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-600',
      trend: '+2',
      trendUp: true,
    },
    {
      title: 'Upcoming Renewals',
      value: metrics.upcomingRenewals.toString(),
      subtitle: 'next 30 days',
      icon: CalendarClock,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      trend: '',
      trendUp: false,
    },
    {
      title: 'Total Licenses',
      value: metrics.totalLicenses.toString(),
      subtitle: `~${formatCurrency(metrics.avgCostPerSubscription)}/subscription`,
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trend: '',
      trendUp: false,
    },
  ];

  const monthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  const chartData = monthlySpend.map(m => ({
    name: monthNames[m.month.split('-')[1]] || m.month,
    spend: Math.round(m.amount),
  }));

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title={`Welcome back, ${currentUser?.name?.split(' ')[0]}`}
        subtitle={`${organization.name} · ${format(new Date(), 'EEEE, MMMM d, yyyy')}`}
        onNavigate={onNavigate}
      />

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Empty State for new accounts */}
        {metrics.activeSubscriptions === 0 && (
          <Card className="text-center py-12 bg-gradient-to-br from-primary-50 to-indigo-50 border-primary-100">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Subscripto!</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              Start tracking your SaaS subscriptions to get insights into your spending,
              receive renewal alerts, and monitor price changes.
            </p>
            <Button onClick={() => onNavigate('subscriptions')} icon={<Plus size={16} />}>
              Add Your First Subscription
            </Button>
          </Card>
        )}

        {/* Price Changes Alert */}
        {priceChanges.length > 0 && (
          <Card className="border-l-4 border-l-warning-500 bg-gradient-to-r from-warning-50 to-orange-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center flex-shrink-0">
                  <Radar size={20} className="text-warning-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {priceChanges.length} Price Change{priceChanges.length > 1 ? 's' : ''} Detected
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {priceChanges.map(pc => (
                      <span key={pc.id} className="inline-flex items-center mr-3">
                        {pc.status === 'increased' ? (
                          <TrendingUp size={14} className="text-danger-500 mr-1" />
                        ) : (
                          <TrendingDown size={14} className="text-accent-500 mr-1" />
                        )}
                        <span className="font-medium">{pc.serviceName}</span>
                        <span className={cn('ml-1 font-semibold', pc.status === 'increased' ? 'text-danger-600' : 'text-accent-600')}>
                          ({pc.changePercent && pc.changePercent > 0 ? '+' : ''}{pc.changePercent?.toFixed(1)}%)
                        </span>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('price-monitor')}
                className="text-sm font-medium text-warning-700 hover:text-warning-800 whitespace-nowrap"
              >
                View Details →
              </button>
            </div>
          </Card>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.subtitle}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.iconBg)}>
                  <stat.icon size={20} className={stat.iconColor} />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {stat.trendUp ? (
                    <ArrowUpRight size={14} className="text-accent-500" />
                  ) : (
                    <ArrowDownRight size={14} className="text-danger-500" />
                  )}
                  <span className={stat.trendUp ? 'text-accent-600' : 'text-danger-600'}>{stat.trend}</span>
                  <span className="text-gray-400">from last month</span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Budget Progress */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Budget Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly spending vs. budget limit</p>
            </div>
            <Badge
              variant={metrics.budgetUsedPercent > 100 ? 'danger' : metrics.budgetUsedPercent > 85 ? 'warning' : 'success'}
              dot
            >
              {metrics.budgetUsedPercent > 100 ? 'Over Budget' : metrics.budgetUsedPercent > 85 ? 'Near Limit' : 'On Track'}
            </Badge>
          </div>
          <ProgressBar
            value={metrics.totalMonthlySpend}
            max={metrics.monthlyBudget}
            label={`${formatCurrency(metrics.totalMonthlySpend)} spent of ${formatCurrency(metrics.monthlyBudget)}`}
            size="lg"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Remaining: {formatCurrency(Math.max(0, metrics.monthlyBudget - metrics.totalMonthlySpend))}</span>
            <span>Yearly estimate: {formatCurrency(metrics.totalYearlySpend)}</span>
          </div>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spend Over Time */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Spending Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5">Monthly spend over time</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <BarChart3 size={14} />
                Last 6 months
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="spend" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Spend by Category */}
          <Card>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Spend by Category</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly cost distribution</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {spendByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Monthly']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {spendByCategory.slice(0, 5).map(cat => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-gray-600">{cat.category}</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatCurrency(cat.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Renewals */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Upcoming Renewals</h3>
                <p className="text-xs text-gray-500 mt-0.5">Next 30 days</p>
              </div>
              <button
                onClick={() => onNavigate('subscriptions')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingRenewals.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  No upcoming renewals in the next 30 days 🎉
                </div>
              ) : (
                upcomingRenewals.slice(0, 5).map(sub => {
                  const daysLeft = differenceInDays(new Date(sub.renewalDate), new Date());
                  return (
                    <div key={sub.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                          {sub.serviceName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{sub.serviceName}</p>
                          <p className="text-xs text-gray-500">{sub.planName} · {sub.licenses} license{sub.licenses > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(sub.price * sub.licenses)}
                        </p>
                        <Badge variant={daysLeft <= 3 ? 'danger' : daysLeft <= 7 ? 'warning' : 'info'}>
                          {daysLeft}d left
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Recent Alerts */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
                <p className="text-xs text-gray-500 mt-0.5">Notifications & warnings</p>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentAlerts.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  All clear! No active alerts.
                </div>
              ) : (
                recentAlerts.map(alert => (
                  <div key={alert.id} className={cn(
                    'px-6 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors',
                    !alert.read && 'bg-primary-50/30'
                  )}>
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', {
                      'bg-danger-500': alert.priority === 'critical',
                      'bg-warning-500': alert.priority === 'high',
                      'bg-primary-500': alert.priority === 'medium',
                      'bg-gray-400': alert.priority === 'low',
                    })} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
                    </div>
                    <Badge variant={
                      alert.priority === 'critical' ? 'danger' :
                      alert.priority === 'high' ? 'warning' :
                      alert.priority === 'medium' ? 'info' : 'neutral'
                    }>
                      {alert.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
