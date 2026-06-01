import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2,
  ExternalLink, ChevronDown, CreditCard, ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import { Subscription } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/utils/cn';

interface SubscriptionsPageProps {
  onNavigate: (page: string) => void;
  onEdit: (sub: Subscription) => void;
  onNew: () => void;
}

type SortField = 'serviceName' | 'price' | 'renewalDate' | 'status';

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ onNavigate, onEdit, onNew }) => {
  const { subscriptions, deleteSubscription, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('renewalDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const categories = useMemo(() =>
    [...new Set(subscriptions.map(s => s.category))].sort(),
    [subscriptions]
  );

  const filtered = useMemo(() => {
    let result = [...subscriptions];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.serviceName.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(s => s.category === categoryFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'serviceName': cmp = a.serviceName.localeCompare(b.serviceName); break;
        case 'price': cmp = (a.price * a.licenses) - (b.price * b.licenses); break;
        case 'renewalDate': cmp = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [subscriptions, search, statusFilter, categoryFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDelete = (id: string) => {
    deleteSubscription(id);
    setDeleteConfirm(null);
    setOpenMenu(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success" dot>Active</Badge>;
      case 'cancelled': return <Badge variant="neutral" dot>Cancelled</Badge>;
      case 'expired': return <Badge variant="danger" dot>Expired</Badge>;
      case 'trial': return <Badge variant="info" dot>Trial</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title="Subscriptions"
        subtitle={`${subscriptions.length} total · ${subscriptions.filter(s => s.status === 'active').length} active`}
        onNavigate={onNavigate}
        actions={
          isAdmin ? (
            <Button onClick={onNew} icon={<Plus size={16} />} className="ml-2">
              Add Subscription
            </Button>
          ) : undefined
        }
      />

      <div className="px-4 lg:px-8 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                  <option value="trial">Trial</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="pl-4 pr-8 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CreditCard size={28} />}
              title={search || statusFilter !== 'all' ? 'No matching subscriptions' : 'No subscriptions yet'}
              description={
                search || statusFilter !== 'all'
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Start tracking your SaaS tools by adding your first subscription.'
              }
              actionLabel={isAdmin ? 'Add Subscription' : undefined}
              onAction={isAdmin ? onNew : undefined}
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3">
                      <button onClick={() => toggleSort('serviceName')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Service <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => toggleSort('price')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Cost <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Licenses</span>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button onClick={() => toggleSort('renewalDate')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Renewal <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Status <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</span>
                    </th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(sub => {
                    const daysLeft = differenceInDays(new Date(sub.renewalDate), new Date());
                    const totalCost = sub.price * sub.licenses;
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                        onClick={() => onEdit(sub)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                              {sub.serviceName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{sub.serviceName}</p>
                              <p className="text-xs text-gray-500">{sub.provider} · {sub.planName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <Badge variant="neutral">{sub.category}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">{formatCurrency(totalCost)}</p>
                          <p className="text-xs text-gray-500">/{sub.billingFrequency === 'monthly' ? 'mo' : sub.billingFrequency === 'yearly' ? 'yr' : sub.billingFrequency}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell text-gray-600">
                          {sub.licenses}
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-gray-900">{format(new Date(sub.renewalDate), 'MMM d, yyyy')}</p>
                          {sub.status === 'active' && (
                            <p className={cn('text-xs', {
                              'text-danger-600 font-medium': daysLeft <= 3,
                              'text-warning-600': daysLeft > 3 && daysLeft <= 7,
                              'text-gray-500': daysLeft > 7,
                            })}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {statusBadge(sub.status)}
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-gray-600 text-xs">{sub.ownerName}</p>
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === sub.id ? null : sub.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenu === sub.id && (
                              <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-10 animate-fade-in">
                                <button
                                  onClick={() => { onEdit(sub); setOpenMenu(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit size={14} /> View / Edit
                                </button>
                                <button
                                  onClick={() => { setOpenMenu(null); window.open(`https://${sub.serviceName.toLowerCase().replace(/\s+/g, '')}.com`, '_blank'); }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <ExternalLink size={14} /> Visit Website
                                </button>
                                {isAdmin && (
                                  <>
                                    <hr className="my-1 border-gray-100" />
                                    {deleteConfirm === sub.id ? (
                                      <div className="px-4 py-2 space-y-2">
                                        <p className="text-xs text-danger-600 font-medium">Confirm delete?</p>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="danger" onClick={() => handleDelete(sub.id)}>Yes</Button>
                                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setDeleteConfirm(sub.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                                      >
                                        <Trash2 size={14} /> Delete
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {subscriptions.length} subscriptions
              {filtered.length > 0 && (
                <span className="ml-2">
                  · Total: {formatCurrency(filtered.reduce((sum, s) => sum + s.price * s.licenses, 0))}/period
                </span>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
