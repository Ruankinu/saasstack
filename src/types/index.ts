export type UserRole = 'owner' | 'admin' | 'viewer';
export type BillingFrequency = 'monthly' | 'yearly' | 'quarterly' | 'weekly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type AlertType = 'renewal' | 'expiration' | 'price_change' | 'budget_warning' | 'expired_active';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'export' | 'settings_change';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  createdAt: string;
  lastLogin: string;
}

export interface Organization {
  id: string;
  name: string;
  currency: string;
  monthlyBudget: number;
  yearlyBudget: number;
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  serviceName: string;
  provider: string;
  planName: string;
  price: number;
  billingFrequency: BillingFrequency;
  startDate: string;
  renewalDate: string;
  licenses: number;
  status: SubscriptionStatus;
  ownerId: string;
  ownerName: string;
  category: string;
  notes: string;
  logoUrl?: string;
  pricingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  organizationId: string;
  subscriptionId?: string;
  subscriptionName?: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  daysUntilRenewal?: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string;
  timestamp: string;
}

export interface PaymentHistory {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
}

export interface DashboardMetrics {
  totalMonthlySpend: number;
  totalYearlySpend: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  upcomingRenewals: number;
  budgetUsedPercent: number;
  monthlyBudget: number;
  potentialSavings: number;
  avgCostPerSubscription: number;
  totalLicenses: number;
}

export interface SpendByCategory {
  category: string;
  amount: number;
  count: number;
  color: string;
}

export interface MonthlySpend {
  month: string;
  amount: number;
}

export type PriceCheckStatus = 'unchanged' | 'increased' | 'decreased' | 'error' | 'pending' | 'never_checked';

export interface PriceHistory {
  date: string;
  price: number;
  source: 'manual' | 'monitor';
}

export interface PriceMonitorEntry {
  id: string;
  subscriptionId: string;
  serviceName: string;
  pricingUrl: string;
  currentPrice: number;
  lastCheckedPrice: number | null;
  lastCheckedAt: string | null;
  status: PriceCheckStatus;
  priceHistory: PriceHistory[];
  changePercent: number | null;
  enabled: boolean;
}
