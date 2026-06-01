import React, { useState } from 'react';
import { Download, FileText, TrendingUp, Calendar, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { format, subDays } from 'date-fns';
import { cn } from '@/utils/cn';

interface ReportsPageProps {
  onNavigate: (page: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { subscriptions, getMetrics, getSpendByCategory, getMonthlySpend, auditLogs, addAuditLog } = useStore();
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    type: 'subscriptions',
    period: '30',
    format: 'csv',
  });
  const [exportSuccess, setExportSuccess] = useState(false);

  const metrics = getMetrics();
  const spendByCategory = getSpendByCategory();
  const monthlySpend = getMonthlySpend();

  const currentMonth = format(new Date(), 'MMMM yyyy');
  const last30Days = format(subDays(new Date(), 30), 'MMM d') + ' - ' + format(new Date(), 'MMM d, yyyy');

  const monthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  const chartData = monthlySpend.map(m => ({
    name: monthNames[m.month.split('-')[1]] || m.month,
    spend: Math.round(m.amount),
  }));

  const categoryChartData = spendByCategory.map(c => ({
    name: c.category.length > 12 ? c.category.substring(0, 12) + '...' : c.category,
    amount: Math.round(c.amount),
    fill: c.color,
  }));

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Properly formatted CSV export for Excel compatibility
  const exportData = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 800));

    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const separator = ';'; // Excel pt-BR uses semicolon
    
    const escapeField = (field: string | number | undefined | null): string => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      // Escape quotes and wrap in quotes if contains separator or quotes
      if (str.includes(separator) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = '';
    let filename = '';
    const today = format(new Date(), 'yyyy-MM-dd');

    if (exportConfig.type === 'subscriptions') {
      // Export all subscriptions
      const headers = ['Service Name', 'Provider', 'Plan', 'Price per License', 'Licenses', 'Total Cost', 'Billing', 'Status', 'Renewal Date', 'Owner', 'Category', 'Notes'];
      const rows = subscriptions.map(s => [
        escapeField(s.serviceName),
        escapeField(s.provider),
        escapeField(s.planName),
        escapeField(s.price.toFixed(2)),
        escapeField(s.licenses),
        escapeField((s.price * s.licenses).toFixed(2)),
        escapeField(s.billingFrequency),
        escapeField(s.status),
        escapeField(s.renewalDate),
        escapeField(s.ownerName),
        escapeField(s.category),
        escapeField(s.notes),
      ]);

      csvContent = BOM + headers.join(separator) + '\n' + rows.map(r => r.join(separator)).join('\n');
      filename = `subscripto-subscriptions-${today}.csv`;

    } else if (exportConfig.type === 'monthly') {
      // Monthly summary report

      // Header section
      csvContent = BOM;
      csvContent += `MONTHLY REPORT - ${currentMonth}\n`;
      csvContent += `Period: ${last30Days}\n`;
      csvContent += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;

      // Summary metrics
      csvContent += `SUMMARY\n`;
      csvContent += `Metric${separator}Value\n`;
      csvContent += `Total Monthly Spend${separator}${metrics.totalMonthlySpend.toFixed(2)}\n`;
      csvContent += `Active Subscriptions${separator}${metrics.activeSubscriptions}\n`;
      csvContent += `Total Licenses${separator}${metrics.totalLicenses}\n`;
      csvContent += `Monthly Budget${separator}${metrics.monthlyBudget.toFixed(2)}\n`;
      csvContent += `Budget Utilization${separator}${metrics.budgetUsedPercent.toFixed(1)}%\n`;
      csvContent += `Average Cost per Subscription${separator}${metrics.avgCostPerSubscription.toFixed(2)}\n`;
      csvContent += `Yearly Projection${separator}${metrics.totalYearlySpend.toFixed(2)}\n\n`;

      // Spend by category
      csvContent += `SPEND BY CATEGORY\n`;
      csvContent += `Category${separator}Monthly Spend${separator}Subscriptions\n`;
      spendByCategory.forEach(c => {
        csvContent += `${escapeField(c.category)}${separator}${c.amount.toFixed(2)}${separator}${c.count}\n`;
      });
      csvContent += '\n';

      // Active subscriptions detail
      csvContent += `ACTIVE SUBSCRIPTIONS\n`;
      csvContent += `Service${separator}Plan${separator}Cost${separator}Licenses${separator}Total${separator}Renewal\n`;
      subscriptions.filter(s => s.status === 'active').forEach(s => {
        csvContent += `${escapeField(s.serviceName)}${separator}${escapeField(s.planName)}${separator}${s.price.toFixed(2)}${separator}${s.licenses}${separator}${(s.price * s.licenses).toFixed(2)}${separator}${s.renewalDate}\n`;
      });

      filename = `subscripto-monthly-report-${today}.csv`;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addAuditLog('export', 'report', `export-${today}`, exportConfig.type === 'subscriptions' ? 'Subscriptions Export' : 'Monthly Report', 
      `Exported ${exportConfig.type === 'subscriptions' ? subscriptions.length + ' subscriptions' : 'monthly report'} to CSV`);

    setExporting(false);
    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
      setShowExportModal(false);
    }, 1500);
  };

  const recentLogs = auditLogs.slice(0, 10);

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title="Reports & Analytics"
        subtitle={`Monthly report • ${last30Days}`}
        onNavigate={onNavigate}
        actions={
          <Button onClick={() => setShowExportModal(true)} icon={<Download size={16} />} className="ml-2">
            Export Report
          </Button>
        }
      />

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Period Header */}
        <Card className="bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-primary-600 shadow-sm">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Monthly Report — {currentMonth}</h2>
                <p className="text-sm text-gray-600">Showing data from {last30Days}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Spend', value: formatCurrency(metrics.totalMonthlySpend), icon: TrendingUp, color: 'text-primary-600' },
            { label: 'Yearly Projection', value: formatCurrency(metrics.totalYearlySpend), icon: Calendar, color: 'text-accent-600' },
            { label: 'Active Subscriptions', value: metrics.activeSubscriptions.toString(), icon: BarChart3, color: 'text-purple-600' },
            { label: 'Avg Cost/Sub', value: formatCurrency(metrics.avgCostPerSubscription), icon: TrendingUp, color: 'text-warning-600' },
          ].map(stat => (
            <Card key={stat.label}>
              <div className="flex items-center gap-3">
                <stat.icon size={18} className={stat.color} />
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Spending Trend</h3>
            <p className="text-xs text-gray-500 mb-4">Historical spend over time</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']} />
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Spend by Category</h3>
            <p className="text-xs text-gray-500 mb-4">Monthly cost distribution</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Monthly']} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category Breakdown Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Category Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Detailed spending by category</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Category</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Monthly Spend</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Yearly Projection</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Subscriptions</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spendByCategory.map(cat => (
                  <tr key={cat.category} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium text-gray-900">{cat.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900 font-medium">{formatCurrency(cat.amount)}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{formatCurrency(cat.amount * 12)}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{cat.count}</td>
                    <td className="px-6 py-3 text-right">
                      <Badge variant="neutral">
                        {((cat.amount / metrics.totalMonthlySpend) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-6 py-3 text-gray-900">Total</td>
                  <td className="px-6 py-3 text-right text-gray-900">{formatCurrency(metrics.totalMonthlySpend)}</td>
                  <td className="px-6 py-3 text-right text-gray-900">{formatCurrency(metrics.totalYearlySpend)}</td>
                  <td className="px-6 py-3 text-right text-gray-900">{metrics.activeSubscriptions}</td>
                  <td className="px-6 py-3 text-right text-gray-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Activity Log */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
            <p className="text-xs text-gray-500 mt-0.5">Recent changes and actions</p>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLogs.map(log => (
              <div key={log.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', {
                  'bg-accent-100 text-accent-600': log.action === 'create',
                  'bg-primary-100 text-primary-600': log.action === 'update',
                  'bg-danger-100 text-danger-600': log.action === 'delete',
                  'bg-gray-100 text-gray-600': log.action === 'login' || log.action === 'export',
                  'bg-warning-100 text-warning-600': log.action === 'settings_change',
                })}>
                  {log.action === 'create' ? <FileText size={14} /> :
                   log.action === 'delete' ? <FileText size={14} /> :
                   <Clock size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{log.details}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {log.userName} · {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <Badge variant={
                  log.action === 'create' ? 'success' :
                  log.action === 'delete' ? 'danger' :
                  log.action === 'update' ? 'info' : 'neutral'
                }>
                  {log.action}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Report"
      >
        {exportSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Export Complete!</h3>
            <p className="text-sm text-gray-500 mt-1">Your file has been downloaded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose what data to export and the format. Files are optimized for Excel and Google Sheets.
            </p>

            <Select
              label="Report Type"
              value={exportConfig.type}
              onChange={e => setExportConfig(prev => ({ ...prev, type: e.target.value }))}
              options={[
                { value: 'subscriptions', label: 'All Subscriptions — Complete list with details' },
                { value: 'monthly', label: 'Monthly Report — Summary with metrics and breakdown' },
              ]}
            />

            {exportConfig.type === 'monthly' && (
              <Select
                label="Period"
                value={exportConfig.period}
                onChange={e => setExportConfig(prev => ({ ...prev, period: e.target.value }))}
                options={[
                  { value: '30', label: 'Last 30 days' },
                  { value: '60', label: 'Last 60 days' },
                  { value: '90', label: 'Last 90 days' },
                ]}
              />
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                {exportConfig.type === 'subscriptions' ? 'Subscriptions Export' : 'Monthly Report'}
              </h4>
              <p className="text-xs text-blue-700">
                {exportConfig.type === 'subscriptions' 
                  ? `Includes ${subscriptions.length} subscriptions with all details: pricing, status, renewal dates, owners, and categories.`
                  : `Comprehensive report with summary metrics, category breakdown, and active subscriptions for the selected period.`
                }
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button onClick={exportData} loading={exporting} icon={<Download size={16} />}>
                Download CSV
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
