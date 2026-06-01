import { create } from 'zustand';
import {
  User, Organization, Subscription, Alert, AuditLog,
  PaymentHistory, DashboardMetrics, SpendByCategory, MonthlySpend,
  UserRole, AuditAction, PriceMonitorEntry
} from '@/types';
import {
  seedOrganization, seedUsers, seedSubscriptions,
  generateAlerts, seedAuditLogs, seedPaymentHistory, seedPriceMonitors
} from '@/data/seed';
import { v4 as uuidv4 } from 'uuid';
import { ToastData } from '@/components/ui/Toast';

interface InviteCode {
  code: string;
  password: string;
  organizationId: string;
  role: UserRole;
  createdBy: string;
  createdAt: string;
  used: boolean;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, orgName: string) => boolean;
  joinWithInvite: (name: string, email: string, password: string, inviteCode: string, invitePassword: string) => boolean;
  logout: () => void;

  // Organization
  organization: Organization;
  updateOrganization: (data: Partial<Organization>) => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'organizationId'>) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  deleteUser: (userId: string) => void;

  // Invites
  invites: InviteCode[];
  createInvite: (role: UserRole) => InviteCode;
  getInvite: (code: string) => InviteCode | undefined;
  deleteInvite: (code: string) => void;

  // Subscriptions
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => void;
  updateSubscription: (id: string, data: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  // Alerts
  alerts: Alert[];
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  dismissAlert: (id: string) => void;
  refreshAlerts: () => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditAction, entityType: string, entityId: string, entityName: string, details: string) => void;

  // Payments
  paymentHistory: PaymentHistory[];

  // Price Monitor
  priceMonitors: PriceMonitorEntry[];
  addPriceMonitor: (subscriptionId: string, pricingUrl: string) => void;
  removePriceMonitor: (id: string) => void;
  togglePriceMonitor: (id: string) => void;

  // Dashboard
  getMetrics: () => DashboardMetrics;
  getSpendByCategory: () => SpendByCategory[];
  getMonthlySpend: () => MonthlySpend[];
  getUpcomingRenewals: () => Subscription[];
  getPriceChanges: () => PriceMonitorEntry[];

  // Toasts
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Communication': '#6366f1',
  'Design': '#8b5cf6',
  'Development': '#10b981',
  'Infrastructure': '#f59e0b',
  'Productivity': '#06b6d4',
  'Sales & CRM': '#ec4899',
  'Project Management': '#6366f1',
  'Marketing': '#f97316',
  'Customer Support': '#14b8a6',
  'Storage': '#64748b',
  'Other': '#94a3b8',
};

// Generate random invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const useStore = create<AppState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  currentUser: null,

  login: (email: string, _password: string) => {
    const user = get().users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      set({
        isAuthenticated: true,
        currentUser: updatedUser,
        users: get().users.map(u => u.id === user.id ? updatedUser : u),
      });
      get().refreshAlerts();
      get().addAuditLog('login', 'user', user.id, user.name, `${user.name} logged in`);
      return true;
    }
    return false;
  },

  register: (name: string, email: string, _password: string, orgName: string) => {
    const existingUser = get().users.find(u => u.email === email);
    if (existingUser) return false;

    // Create new organization
    const newOrgId = uuidv4();
    const newOrg: Organization = {
      id: newOrgId,
      name: orgName,
      currency: 'USD',
      monthlyBudget: 5000,
      yearlyBudget: 60000,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };

    // Create user as owner of new org
    const newUser: User = {
      id: uuidv4(),
      email,
      name,
      role: 'owner',
      organizationId: newOrgId,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    set({
      isAuthenticated: true,
      currentUser: newUser,
      users: [newUser], // New org has only this user
      organization: newOrg,
      subscriptions: [], // Start empty
      alerts: [],
      auditLogs: [],
      paymentHistory: [],
      priceMonitors: [],
      invites: [],
    });

    get().addToast({ type: 'success', title: 'Account created!', message: `Welcome to ${orgName}` });
    return true;
  },

  joinWithInvite: (name: string, email: string, _password: string, inviteCode: string, invitePassword: string) => {
    const invite = get().invites.find(i => i.code === inviteCode && !i.used);
    if (!invite || invite.password !== invitePassword) return false;

    const existingUser = get().users.find(u => u.email === email);
    if (existingUser) return false;

    const newUser: User = {
      id: uuidv4(),
      email,
      name,
      role: invite.role,
      organizationId: invite.organizationId,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    set({
      isAuthenticated: true,
      currentUser: newUser,
      users: [...get().users, newUser],
      invites: get().invites.map(i => i.code === inviteCode ? { ...i, used: true } : i),
    });

    get().addAuditLog('create', 'user', newUser.id, newUser.name, `${newUser.name} joined via invite code`);
    get().addToast({ type: 'success', title: 'Welcome!', message: `You joined ${get().organization.name}` });
    return true;
  },

  logout: () => {
    // Reset to demo data on logout
    set({
      isAuthenticated: false,
      currentUser: null,
      organization: seedOrganization,
      users: seedUsers,
      subscriptions: seedSubscriptions,
      alerts: generateAlerts(seedSubscriptions),
      auditLogs: seedAuditLogs,
      paymentHistory: seedPaymentHistory,
      priceMonitors: seedPriceMonitors,
      invites: [],
    });
  },

  // Organization
  organization: seedOrganization,
  updateOrganization: (data) => {
    set({ organization: { ...get().organization, ...data } });
    get().addAuditLog('settings_change', 'organization', get().organization.id, get().organization.name, 'Organization settings updated');
  },

  // Users
  users: seedUsers,
  addUser: (userData) => {
    const newUser: User = { ...userData, id: uuidv4(), organizationId: get().organization.id, createdAt: new Date().toISOString(), lastLogin: '' };
    set({ users: [...get().users, newUser] });
    get().addAuditLog('create', 'user', newUser.id, newUser.name, `Added user ${newUser.name} as ${newUser.role}`);
  },
  updateUser: (userId, data) => {
    set({ 
      users: get().users.map(u => u.id === userId ? { ...u, ...data } : u),
      currentUser: get().currentUser?.id === userId ? { ...get().currentUser!, ...data } : get().currentUser,
    });
  },
  updateUserRole: (userId, role) => {
    const user = get().users.find(u => u.id === userId);
    set({ users: get().users.map(u => u.id === userId ? { ...u, role } : u) });
    if (user) get().addAuditLog('update', 'user', userId, user.name, `Changed role to ${role}`);
  },
  deleteUser: (userId) => {
    const user = get().users.find(u => u.id === userId);
    set({ users: get().users.filter(u => u.id !== userId) });
    if (user) get().addAuditLog('delete', 'user', userId, user.name, `Removed user ${user.name}`);
  },

  // Invites
  invites: [],
  createInvite: (role) => {
    const invite: InviteCode = {
      code: generateInviteCode(),
      password: Math.random().toString(36).substring(2, 8),
      organizationId: get().organization.id,
      role,
      createdBy: get().currentUser?.id || '',
      createdAt: new Date().toISOString(),
      used: false,
    };
    set({ invites: [...get().invites, invite] });
    get().addAuditLog('create', 'invite', invite.code, `Invite ${invite.code}`, `Created invite code for ${role}`);
    return invite;
  },
  getInvite: (code) => get().invites.find(i => i.code === code && !i.used),
  deleteInvite: (code: string) => {
    const invite = get().invites.find(i => i.code === code);
    set({ invites: get().invites.filter(i => i.code !== code) });
    if (invite) {
      get().addAuditLog('delete', 'invite', invite.code, `Invite ${invite.code}`, `Deleted invite code`);
    }
  },

  // Subscriptions
  subscriptions: seedSubscriptions,
  addSubscription: (subData) => {
    const newSub: Subscription = { ...subData, id: uuidv4(), organizationId: get().organization.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set({ subscriptions: [...get().subscriptions, newSub] });
    get().addAuditLog('create', 'subscription', newSub.id, newSub.serviceName, `Created subscription: ${newSub.serviceName} ${newSub.planName}`);
    get().refreshAlerts();
    get().addToast({ type: 'success', title: 'Subscription added', message: newSub.serviceName });
  },
  updateSubscription: (id, data) => {
    const sub = get().subscriptions.find(s => s.id === id);
    set({ subscriptions: get().subscriptions.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s) });
    if (sub) {
      const changes = Object.keys(data).join(', ');
      get().addAuditLog('update', 'subscription', id, sub.serviceName, `Updated ${changes}`);
      get().addToast({ type: 'success', title: 'Subscription updated', message: sub.serviceName });
    }
    get().refreshAlerts();
  },
  deleteSubscription: (id) => {
    const sub = get().subscriptions.find(s => s.id === id);
    set({ subscriptions: get().subscriptions.filter(s => s.id !== id) });
    if (sub) {
      get().addAuditLog('delete', 'subscription', id, sub.serviceName, `Deleted subscription: ${sub.serviceName}`);
      get().addToast({ type: 'success', title: 'Subscription deleted', message: sub.serviceName });
    }
    get().refreshAlerts();
  },

  // Alerts
  alerts: generateAlerts(seedSubscriptions),
  markAlertRead: (id) => set({ alerts: get().alerts.map(a => a.id === id ? { ...a, read: true } : a) }),
  markAllAlertsRead: () => {
    const unread = get().alerts.filter(a => !a.read && !a.dismissed).length;
    set({ alerts: get().alerts.map(a => ({ ...a, read: true })) });
    if (unread > 0) {
      get().addToast({ type: 'success', title: 'All caught up!', message: `${unread} alerts marked as read` });
    }
  },
  dismissAlert: (id) => set({ alerts: get().alerts.map(a => a.id === id ? { ...a, dismissed: true } : a) }),
  refreshAlerts: () => {
    const newAlerts = generateAlerts(get().subscriptions);
    const existingAlertStates = new Map(get().alerts.map(a => [a.id, { read: a.read, dismissed: a.dismissed }]));
    const mergedAlerts = newAlerts.map(a => {
      const existing = existingAlertStates.get(a.id);
      return existing ? { ...a, read: existing.read, dismissed: existing.dismissed } : a;
    });

    // Budget alert
    const metrics = get().getMetrics();
    if (metrics.budgetUsedPercent > 90) {
      const existBudgetAlert = mergedAlerts.find(a => a.type === 'budget_warning');
      if (!existBudgetAlert) {
        mergedAlerts.unshift({
          id: 'alert-budget',
          organizationId: get().organization.id,
          type: 'budget_warning',
          priority: metrics.budgetUsedPercent > 100 ? 'critical' : 'high',
          title: metrics.budgetUsedPercent > 100 ? 'Budget exceeded!' : 'Approaching budget limit',
          message: `Current monthly spend is ${metrics.budgetUsedPercent.toFixed(0)}% of your $${get().organization.monthlyBudget.toLocaleString()} budget.`,
          read: false, dismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Price change alerts
    const priceChanges = get().priceMonitors.filter(pm => pm.status === 'increased' || pm.status === 'decreased');
    priceChanges.forEach(pm => {
      const alertId = `alert-price-${pm.id}`;
      if (!mergedAlerts.find(a => a.id === alertId)) {
        const existing = existingAlertStates.get(alertId);
        mergedAlerts.push({
          id: alertId,
          organizationId: get().organization.id,
          subscriptionId: pm.subscriptionId,
          subscriptionName: pm.serviceName,
          type: 'price_change',
          priority: pm.status === 'increased' ? 'high' : 'medium',
          title: `${pm.serviceName} price ${pm.status === 'increased' ? 'increased' : 'decreased'}`,
          message: `${pm.serviceName} pricing page shows $${pm.lastCheckedPrice?.toFixed(2)}/license (was $${pm.currentPrice.toFixed(2)}). Change: ${pm.changePercent && pm.changePercent > 0 ? '+' : ''}${pm.changePercent?.toFixed(1)}%.`,
          read: existing?.read ?? false,
          dismissed: existing?.dismissed ?? false,
          createdAt: pm.lastCheckedAt || new Date().toISOString(),
        });
      }
    });

    set({ alerts: mergedAlerts });
  },

  // Audit Logs
  auditLogs: seedAuditLogs,
  addAuditLog: (action, entityType, entityId, entityName, details) => {
    const user = get().currentUser;
    if (!user) return;
    const log: AuditLog = {
      id: uuidv4(), organizationId: get().organization.id,
      userId: user.id, userName: user.name,
      action, entityType, entityId, entityName, details,
      timestamp: new Date().toISOString(),
    };
    set({ auditLogs: [log, ...get().auditLogs] });
  },

  // Payments
  paymentHistory: seedPaymentHistory,

  // Price Monitor
  priceMonitors: seedPriceMonitors,

  addPriceMonitor: (subscriptionId, pricingUrl) => {
    const sub = get().subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return;
    const existing = get().priceMonitors.find(pm => pm.subscriptionId === subscriptionId);
    if (existing) return;
    const entry: PriceMonitorEntry = {
      id: uuidv4(),
      subscriptionId,
      serviceName: sub.serviceName,
      pricingUrl,
      currentPrice: sub.price,
      lastCheckedPrice: null,
      lastCheckedAt: null,
      status: 'never_checked',
      priceHistory: [{ date: new Date().toISOString().split('T')[0], price: sub.price, source: 'manual' }],
      changePercent: null,
      enabled: true,
    };
    set({ priceMonitors: [...get().priceMonitors, entry] });
    get().addAuditLog('create', 'price_monitor', entry.id, sub.serviceName, `Added price monitoring for ${sub.serviceName}`);
    get().addToast({ type: 'success', title: 'Monitor added', message: `Now tracking ${sub.serviceName} pricing` });
  },

  removePriceMonitor: (id) => {
    const pm = get().priceMonitors.find(p => p.id === id);
    set({ priceMonitors: get().priceMonitors.filter(p => p.id !== id) });
    if (pm) {
      get().addAuditLog('delete', 'price_monitor', id, pm.serviceName, `Removed price monitoring for ${pm.serviceName}`);
      get().addToast({ type: 'success', title: 'Monitor removed', message: pm.serviceName });
    }
  },

  togglePriceMonitor: (id) => {
    const pm = get().priceMonitors.find(p => p.id === id);
    set({
      priceMonitors: get().priceMonitors.map(p =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    });
    if (pm) {
      get().addToast({ 
        type: 'info', 
        title: pm.enabled ? 'Monitor paused' : 'Monitor resumed', 
        message: pm.serviceName 
      });
    }
  },

  // Dashboard
  getMetrics: () => {
    const subs = get().subscriptions.filter(s => s.status === 'active');
    const totalMonthly = subs.reduce((sum, s) => {
      const monthlyCost = s.billingFrequency === 'yearly' ? s.price / 12 :
        s.billingFrequency === 'quarterly' ? s.price / 3 :
        s.billingFrequency === 'weekly' ? s.price * 4 : s.price;
      return sum + (monthlyCost * s.licenses);
    }, 0);
    const now = new Date();
    const upcoming = subs.filter(s => {
      const diff = Math.ceil((new Date(s.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 30;
    });
    return {
      totalMonthlySpend: totalMonthly,
      totalYearlySpend: totalMonthly * 12,
      activeSubscriptions: subs.length,
      cancelledSubscriptions: get().subscriptions.filter(s => s.status === 'cancelled').length,
      upcomingRenewals: upcoming.length,
      budgetUsedPercent: get().organization.monthlyBudget > 0 ? (totalMonthly / get().organization.monthlyBudget) * 100 : 0,
      monthlyBudget: get().organization.monthlyBudget,
      potentialSavings: 0,
      avgCostPerSubscription: subs.length > 0 ? totalMonthly / subs.length : 0,
      totalLicenses: subs.reduce((sum, s) => sum + s.licenses, 0),
    };
  },

  getSpendByCategory: () => {
    const subs = get().subscriptions.filter(s => s.status === 'active');
    const categoryMap = new Map<string, { amount: number; count: number }>();
    subs.forEach(s => {
      const monthlyCost = s.billingFrequency === 'yearly' ? (s.price / 12) * s.licenses :
        s.billingFrequency === 'quarterly' ? (s.price / 3) * s.licenses :
        s.billingFrequency === 'weekly' ? (s.price * 4) * s.licenses : s.price * s.licenses;
      const existing = categoryMap.get(s.category) || { amount: 0, count: 0 };
      categoryMap.set(s.category, { amount: existing.amount + monthlyCost, count: existing.count + 1 });
    });
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category, amount: data.amount, count: data.count,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'],
    })).sort((a, b) => b.amount - a.amount);
  },

  getMonthlySpend: () => {
    const payments = get().paymentHistory;
    const monthMap = new Map<string, number>();
    payments.forEach(p => {
      const month = p.date.substring(0, 7);
      monthMap.set(month, (monthMap.get(month) || 0) + p.amount);
    });
    return Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  getUpcomingRenewals: () => {
    const now = new Date();
    return get().subscriptions
      .filter(s => s.status === 'active')
      .filter(s => {
        const diff = Math.ceil((new Date(s.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 && diff <= 30;
      })
      .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());
  },

  getPriceChanges: () => {
    return get().priceMonitors.filter(pm => pm.status === 'increased' || pm.status === 'decreased');
  },

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = uuidv4();
    set({ toasts: [...get().toasts, { ...toast, id }] });
  },
  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
