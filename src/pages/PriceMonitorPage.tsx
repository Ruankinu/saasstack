import React, { useState, useEffect } from 'react';
import {
  Radar, TrendingUp, TrendingDown,
  Plus, ExternalLink, Trash2, Power, PowerOff, AlertTriangle,
  CheckCircle2, Clock, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import { PriceMonitorEntry } from '@/types';
import { cn } from '@/utils/cn';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

interface PriceMonitorPageProps {
  onNavigate: (page: string) => void;
}

// Calculate time until next 6 AM
const getTimeUntilNextScan = (): string => {
  const now = new Date();
  const next6AM = new Date(now);
  next6AM.setHours(6, 0, 0, 0);
  
  // If it's already past 6 AM today, next scan is tomorrow
  if (now.getHours() >= 6) {
    next6AM.setDate(next6AM.getDate() + 1);
  }
  
  const diffMs = next6AM.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

export const PriceMonitorPage: React.FC<PriceMonitorPageProps> = ({ onNavigate }) => {
  const {
    priceMonitors, subscriptions, addPriceMonitor, removePriceMonitor,
    togglePriceMonitor, currentUser
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<PriceMonitorEntry | null>(null);
  const [addForm, setAddForm] = useState({ subscriptionId: '', pricingUrl: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [timeUntilScan, setTimeUntilScan] = useState(getTimeUntilNextScan());

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin' || isOwner;

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilScan(getTimeUntilNextScan());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const priceChanges = priceMonitors.filter(pm => pm.status === 'increased' || pm.status === 'decreased');
  const monitored = priceMonitors.filter(pm => pm.enabled).length;
  const increased = priceMonitors.filter(pm => pm.status === 'increased').length;
  const decreased = priceMonitors.filter(pm => pm.status === 'decreased').length;

  // Subscriptions not yet monitored
  const unmonitoredSubs = subscriptions.filter(
    s => s.status === 'active' && !priceMonitors.find(pm => pm.subscriptionId === s.id)
  );

  const handleAddMonitor = () => {
    const newErrors: Record<string, string> = {};
    if (!addForm.subscriptionId) newErrors.subscriptionId = 'Select a subscription';
    if (!addForm.pricingUrl.trim()) newErrors.pricingUrl = 'Pricing URL is required';
    else if (!addForm.pricingUrl.startsWith('http')) newErrors.pricingUrl = 'Enter a valid URL starting with http';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    addPriceMonitor(addForm.subscriptionId, addForm.pricingUrl);
    setAddForm({ subscriptionId: '', pricingUrl: '' });
    setShowAddModal(false);
  };

  const getStatusInfo = (pm: PriceMonitorEntry) => {
    if (!pm.enabled) {
      return { icon: <PowerOff size={20} className="text-gray-400" />, bg: 'bg-gray-100', label: 'Paused' };
    }
    switch (pm.status) {
      case 'increased':
        return { icon: <TrendingUp size={20} className="text-danger-600" />, bg: 'bg-danger-100', label: 'Price increased' };
      case 'decreased':
        return { icon: <TrendingDown size={20} className="text-accent-600" />, bg: 'bg-accent-100', label: 'Price decreased' };
      case 'unchanged':
        return { icon: <CheckCircle2 size={20} className="text-accent-600" />, bg: 'bg-accent-50', label: 'Checked today' };
      case 'never_checked':
        return { icon: <Clock size={20} className="text-blue-500" />, bg: 'bg-blue-50', label: 'Awaiting first scan' };
      default:
        return { icon: <Clock size={20} className="text-gray-400" />, bg: 'bg-gray-100', label: 'Pending' };
    }
  };

  const statusBadge = (pm: PriceMonitorEntry) => {
    if (!pm.enabled) {
      return <Badge variant="neutral">Paused</Badge>;
    }
    switch (pm.status) {
      case 'increased':
        return <Badge variant="danger" dot>+{pm.changePercent?.toFixed(1)}%</Badge>;
      case 'decreased':
        return <Badge variant="success" dot>{pm.changePercent?.toFixed(1)}%</Badge>;
      case 'unchanged':
        return <Badge variant="success" dot>Stable</Badge>;
      case 'never_checked':
        return <Badge variant="info">Pending</Badge>;
      default:
        return <Badge variant="neutral">—</Badge>;
    }
  };

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title="Price Monitor"
        subtitle="Automatic daily price tracking"
        onNavigate={onNavigate}
        actions={
          isAdmin ? (
            <Button onClick={() => setShowAddModal(true)} icon={<Plus size={15} />} size="sm">
              Add Monitor
            </Button>
          ) : undefined
        }
      />

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Auto-scan info banner */}
        <Card className="bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center text-primary-600 shadow-sm">
                <Radar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Automatic Price Monitoring</h3>
                <p className="text-xs text-gray-600 mt-0.5">Prices are checked automatically every day at 6:00 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg">
              <Clock size={14} className="text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Next scan in {timeUntilScan}</span>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Radar size={18} className="text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Monitored</p>
                <p className="text-xl font-bold text-gray-900">{monitored}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center">
                <ArrowUpRight size={18} className="text-danger-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Price Increased</p>
                <p className="text-xl font-bold text-danger-600">{increased}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <ArrowDownRight size={18} className="text-accent-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Price Decreased</p>
                <p className="text-xl font-bold text-accent-600">{decreased}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Stable</p>
                <p className="text-xl font-bold text-gray-900">{priceMonitors.filter(pm => pm.status === 'unchanged').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Price Changes Alert Banner */}
        {priceChanges.length > 0 && (
          <Card className="border-l-4 border-l-warning-500 bg-warning-50/50">
            <div className="flex items-start gap-4">
              <AlertTriangle size={22} className="text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">
                  {priceChanges.length} price change{priceChanges.length > 1 ? 's' : ''} detected
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {priceChanges.map(pc => (
                    <span key={pc.id} className="inline-flex items-center mr-3">
                      <span className="font-medium">{pc.serviceName}</span>
                      <span className={cn('ml-1 font-semibold', pc.status === 'increased' ? 'text-danger-600' : 'text-accent-600')}>
                        ({pc.changePercent && pc.changePercent > 0 ? '+' : ''}{pc.changePercent?.toFixed(1)}%)
                      </span>
                    </span>
                  ))}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Review your subscriptions and update pricing if needed.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Monitor List */}
        {priceMonitors.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Radar size={28} />}
              title="No price monitors set up"
              description="Start monitoring pricing pages to get notified when your SaaS tools change their prices."
              actionLabel={isAdmin ? "Add Your First Monitor" : undefined}
              onAction={isAdmin ? () => setShowAddModal(true) : undefined}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {priceMonitors.map(pm => {
              const statusInfo = getStatusInfo(pm);
              return (
                <Card key={pm.id} padding="none" className={cn(
                  'transition-all',
                  pm.status === 'increased' && pm.enabled && 'ring-1 ring-danger-200',
                  pm.status === 'decreased' && pm.enabled && 'ring-1 ring-accent-200',
                  !pm.enabled && 'opacity-60'
                )}>
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', statusInfo.bg)}>
                        {statusInfo.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-gray-900">{pm.serviceName}</h4>
                              {statusBadge(pm)}
                            </div>
                            <a
                              href={pm.pricingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 mt-1 truncate max-w-xs"
                              onClick={e => e.stopPropagation()}
                            >
                              {pm.pricingUrl} <ExternalLink size={10} />
                            </a>
                          </div>

                          {/* Price display */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Your price</p>
                            <p className="text-base font-bold text-gray-900">{formatCurrency(pm.currentPrice)}<span className="text-xs font-normal text-gray-400">/license</span></p>
                            {pm.lastCheckedPrice !== null && pm.status !== 'unchanged' && pm.enabled && (
                              <div className="mt-1">
                                <p className="text-xs text-gray-500">Detected</p>
                                <p className={cn(
                                  'text-base font-bold',
                                  pm.status === 'increased' ? 'text-danger-600' : 'text-accent-600'
                                )}>
                                  {formatCurrency(pm.lastCheckedPrice)}
                                  <span className={cn('text-xs ml-1 font-semibold',
                                    pm.status === 'increased' ? 'text-danger-500' : 'text-accent-500'
                                  )}>
                                    {pm.changePercent && pm.changePercent > 0 ? '↑' : '↓'}{Math.abs(pm.changePercent || 0).toFixed(1)}%
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions & Status */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full',
                              pm.enabled ? 'bg-accent-50 text-accent-700' : 'bg-gray-100 text-gray-500'
                            )}>
                              {statusInfo.label}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span>{pm.priceHistory.length} price points</span>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setShowHistoryModal(pm)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                title="View history"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => togglePriceMonitor(pm.id)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  pm.enabled ? "text-accent-500 hover:bg-accent-50" : "text-gray-400 hover:bg-gray-100"
                                )}
                                title={pm.enabled ? 'Pause monitoring' : 'Resume monitoring'}
                              >
                                {pm.enabled ? <Power size={15} /> : <PowerOff size={15} />}
                              </button>
                              {deleteConfirm === pm.id ? (
                                <div className="flex items-center gap-1 ml-1">
                                  <Button size="sm" variant="danger" onClick={() => { removePriceMonitor(pm.id); setDeleteConfirm(null); }}>
                                    Yes
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(pm.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                                  title="Remove monitor"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <Card>
          <h3 className="text-sm font-bold text-gray-900 mb-3">How Price Monitor Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Add a pricing URL', desc: 'Paste the pricing page URL for any SaaS tool you use.' },
              { step: '2', title: 'Daily automatic scans', desc: 'The system scans pricing pages every day at 6:00 AM.' },
              { step: '3', title: 'Get alerted instantly', desc: 'Receive alerts when a price increases or decreases.' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add Monitor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setErrors({}); }}
        title="Add Price Monitor"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a subscription and paste its pricing page URL. The system will check it daily for price changes.
          </p>
          <Select
            label="Subscription"
            value={addForm.subscriptionId}
            onChange={e => setAddForm(prev => ({ ...prev, subscriptionId: e.target.value }))}
            options={[
              { value: '', label: 'Select a subscription...' },
              ...unmonitoredSubs.map(s => ({
                value: s.id,
                label: `${s.serviceName} — $${s.price}/${s.billingFrequency === 'monthly' ? 'mo' : s.billingFrequency}`
              }))
            ]}
            error={errors.subscriptionId}
          />
          <Input
            label="Pricing Page URL"
            type="url"
            placeholder="https://example.com/pricing"
            value={addForm.pricingUrl}
            onChange={e => setAddForm(prev => ({ ...prev, pricingUrl: e.target.value }))}
            error={errors.pricingUrl}
            helperText="The URL of the provider's public pricing page"
          />
          {unmonitoredSubs.length === 0 && (
            <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-lg border border-blue-200">
              All active subscriptions are already being monitored!
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddMonitor} disabled={unmonitoredSubs.length === 0} icon={<Radar size={16} />}>
              Start Monitoring
            </Button>
          </div>
        </div>
      </Modal>

      {/* Price History Modal */}
      <Modal
        isOpen={!!showHistoryModal}
        onClose={() => setShowHistoryModal(null)}
        title={showHistoryModal ? `${showHistoryModal.serviceName} — Price History` : ''}
        size="lg"
      >
        {showHistoryModal && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">Your Price</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(showHistoryModal.currentPrice)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">Detected Price</p>
                <p className={cn('text-lg font-bold', {
                  'text-danger-600': showHistoryModal.status === 'increased',
                  'text-accent-600': showHistoryModal.status === 'decreased',
                  'text-gray-900': showHistoryModal.status !== 'increased' && showHistoryModal.status !== 'decreased',
                })}>
                  {showHistoryModal.lastCheckedPrice !== null ? formatCurrency(showHistoryModal.lastCheckedPrice) : '—'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">Change</p>
                <p className={cn('text-lg font-bold', {
                  'text-danger-600': showHistoryModal.status === 'increased',
                  'text-accent-600': showHistoryModal.status === 'decreased',
                  'text-gray-900': showHistoryModal.status !== 'increased' && showHistoryModal.status !== 'decreased',
                })}>
                  {showHistoryModal.changePercent !== null
                    ? `${showHistoryModal.changePercent > 0 ? '+' : ''}${showHistoryModal.changePercent.toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={showHistoryModal.priceHistory.map(p => ({
                  date: p.date.length > 7 ? p.date.substring(5) : p.date,
                  price: p.price,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']} />
                  <ReferenceLine y={showHistoryModal.currentPrice} stroke="#6366f1" strokeDasharray="5 5" label={{ value: 'Your Price', position: 'insideTopRight', fontSize: 11, fill: '#6366f1' }} />
                  <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History table */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Log</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Price</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Source</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...showHistoryModal.priceHistory].reverse().map((ph, i, arr) => {
                      const prev = arr[i + 1];
                      const change = prev ? ((ph.price - prev.price) / prev.price) * 100 : 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-900">{ph.date}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{formatCurrency(ph.price)}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={ph.source === 'monitor' ? 'info' : 'neutral'}>
                              {ph.source === 'monitor' ? 'Auto-scan' : 'Manual'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            {change !== 0 ? (
                              <span className={cn('font-medium', change > 0 ? 'text-danger-600' : 'text-accent-600')}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
