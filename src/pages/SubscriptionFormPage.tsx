import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import { Subscription, BillingFrequency, SubscriptionStatus } from '@/types';
import { format, differenceInDays } from 'date-fns';

interface SubscriptionFormPageProps {
  subscription?: Subscription | null;
  onNavigate: (page: string) => void;
  onBack: () => void;
}

const CATEGORIES = [
  'Communication', 'Design', 'Development', 'Infrastructure',
  'Productivity', 'Sales & CRM', 'Project Management', 'Marketing',
  'Customer Support', 'Storage', 'Security', 'Analytics', 'Finance', 'HR', 'Other'
];

export const SubscriptionFormPage: React.FC<SubscriptionFormPageProps> = ({
  subscription,
  onNavigate,
  onBack,
}) => {
  const { addSubscription, updateSubscription, deleteSubscription, users, currentUser, subscriptions } = useStore();
  const isEditing = !!subscription;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const [form, setForm] = useState({
    serviceName: '',
    provider: '',
    planName: '',
    price: '',
    billingFrequency: 'monthly' as BillingFrequency,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    renewalDate: '',
    licenses: '1',
    status: 'active' as SubscriptionStatus,
    ownerId: currentUser?.id || '',
    ownerName: currentUser?.name || '',
    category: 'Other',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (subscription) {
      setForm({
        serviceName: subscription.serviceName,
        provider: subscription.provider,
        planName: subscription.planName,
        price: subscription.price.toString(),
        billingFrequency: subscription.billingFrequency,
        startDate: subscription.startDate,
        renewalDate: subscription.renewalDate,
        licenses: subscription.licenses.toString(),
        status: subscription.status,
        ownerId: subscription.ownerId,
        ownerName: subscription.ownerName,
        category: subscription.category,
        notes: subscription.notes,
      });
    }
  }, [subscription]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.serviceName.trim()) newErrors.serviceName = 'Service name is required';
    if (!form.provider.trim()) newErrors.provider = 'Provider is required';
    if (!form.planName.trim()) newErrors.planName = 'Plan name is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      newErrors.price = 'Valid price is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.renewalDate) newErrors.renewalDate = 'Renewal date is required';
    if (!form.licenses || parseInt(form.licenses) < 1) newErrors.licenses = 'At least 1 license required';

    // Duplicate check
    if (!isEditing) {
      const duplicate = subscriptions.find(
        s => s.serviceName.toLowerCase() === form.serviceName.trim().toLowerCase() &&
          s.status === 'active'
      );
      if (duplicate) {
        newErrors.serviceName = `An active subscription for "${form.serviceName}" already exists. Update the existing one or use a different name.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    await new Promise(r => setTimeout(r, 500));

    const selectedUser = users.find(u => u.id === form.ownerId);
    const data = {
      serviceName: form.serviceName.trim(),
      provider: form.provider.trim(),
      planName: form.planName.trim(),
      price: parseFloat(form.price),
      billingFrequency: form.billingFrequency,
      startDate: form.startDate,
      renewalDate: form.renewalDate,
      licenses: parseInt(form.licenses),
      status: form.status,
      ownerId: form.ownerId,
      ownerName: selectedUser?.name || form.ownerName,
      category: form.category,
      notes: form.notes,
    };

    if (isEditing && subscription) {
      updateSubscription(subscription.id, data);
    } else {
      addSubscription(data);
    }
    setSaving(false);
    onBack();
  };

  const handleDelete = () => {
    if (subscription) {
      deleteSubscription(subscription.id);
      onBack();
    }
  };

  const monthlyCost = form.price ? (
    form.billingFrequency === 'yearly' ? parseFloat(form.price) / 12 :
    form.billingFrequency === 'quarterly' ? parseFloat(form.price) / 3 :
    form.billingFrequency === 'weekly' ? parseFloat(form.price) * 4 :
    parseFloat(form.price)
  ) : 0;

  const totalMonthlyCost = monthlyCost * (parseInt(form.licenses) || 1);

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title={isEditing ? `Edit ${subscription?.serviceName}` : 'New Subscription'}
        subtitle={isEditing ? `Last updated ${subscription ? format(new Date(subscription.updatedAt), 'MMM d, yyyy') : ''}` : 'Track a new SaaS subscription'}
        onNavigate={onNavigate}
        actions={
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />} className="ml-2">
            Back
          </Button>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Service Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Service Name *"
                placeholder="e.g. Slack, Figma, AWS"
                value={form.serviceName}
                onChange={e => updateField('serviceName', e.target.value)}
                error={errors.serviceName}
                disabled={!isAdmin}
              />
              <Input
                label="Provider *"
                placeholder="e.g. Salesforce, Microsoft"
                value={form.provider}
                onChange={e => updateField('provider', e.target.value)}
                error={errors.provider}
                disabled={!isAdmin}
              />
              <Input
                label="Plan Name *"
                placeholder="e.g. Pro, Business, Enterprise"
                value={form.planName}
                onChange={e => updateField('planName', e.target.value)}
                error={errors.planName}
                disabled={!isAdmin}
              />
              <Select
                label="Category"
                value={form.category}
                onChange={e => updateField('category', e.target.value)}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                disabled={!isAdmin}
              />
            </div>
          </Card>

          {/* Pricing */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Pricing & Billing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Price per license *"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
                error={errors.price}
                disabled={!isAdmin}
              />
              <Select
                label="Billing Frequency"
                value={form.billingFrequency}
                onChange={e => updateField('billingFrequency', e.target.value)}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'yearly', label: 'Yearly' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
                disabled={!isAdmin}
              />
              <Input
                label="Number of Licenses *"
                type="number"
                min="1"
                placeholder="1"
                value={form.licenses}
                onChange={e => updateField('licenses', e.target.value)}
                error={errors.licenses}
                disabled={!isAdmin}
              />
            </div>

            {form.price && (
              <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-primary-600 font-medium">Per License</p>
                    <p className="text-lg font-bold text-primary-900">${monthlyCost.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600 font-medium">Total Monthly</p>
                    <p className="text-lg font-bold text-primary-900">${totalMonthlyCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600 font-medium">Total Yearly</p>
                    <p className="text-lg font-bold text-primary-900">${(totalMonthlyCost * 12).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600 font-medium">Licenses</p>
                    <p className="text-lg font-bold text-primary-900">{form.licenses || 1}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Dates & Status */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Schedule & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Start Date *"
                type="date"
                value={form.startDate}
                onChange={e => updateField('startDate', e.target.value)}
                error={errors.startDate}
                disabled={!isAdmin}
              />
              <Input
                label="Renewal Date *"
                type="date"
                value={form.renewalDate}
                onChange={e => updateField('renewalDate', e.target.value)}
                error={errors.renewalDate}
                disabled={!isAdmin}
              />
              <Select
                label="Status"
                value={form.status}
                onChange={e => updateField('status', e.target.value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'trial', label: 'Trial' },
                ]}
                disabled={!isAdmin}
              />
            </div>

            {form.renewalDate && form.status === 'active' && (
              <div className="mt-3">
                {(() => {
                  const daysLeft = differenceInDays(new Date(form.renewalDate), new Date());
                  if (daysLeft < 0) {
                    return (
                      <div className="flex items-center gap-2 text-danger-600 bg-danger-50 px-4 py-2 rounded-lg">
                        <AlertCircle size={16} />
                        <span className="text-sm">This subscription appears to be overdue by {Math.abs(daysLeft)} days</span>
                      </div>
                    );
                  }
                  if (daysLeft <= 7) {
                    return (
                      <Badge variant="warning" dot>Renews in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Badge>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </Card>

          {/* Owner & Notes */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Assignment & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Owner / Responsible"
                value={form.ownerId}
                onChange={e => {
                  updateField('ownerId', e.target.value);
                  const user = users.find(u => u.id === e.target.value);
                  if (user) updateField('ownerName', user.name);
                }}
                options={users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
                disabled={!isAdmin}
              />
              <div />
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  placeholder="Additional notes about this subscription..."
                  value={form.notes}
                  onChange={e => updateField('notes', e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          {isAdmin && (
            <div className="flex items-center justify-between">
              <div>
                {isEditing && (
                  deleteConfirm ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-danger-600 font-medium">Permanently delete this subscription?</span>
                      <Button variant="danger" size="sm" onClick={handleDelete}>Yes, delete</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" onClick={() => setDeleteConfirm(true)} icon={<Trash2 size={16} />}>
                      Delete
                    </Button>
                  )
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={onBack}>Cancel</Button>
                <Button type="submit" loading={saving} icon={<Save size={16} />}>
                  {isEditing ? 'Save Changes' : 'Create Subscription'}
                </Button>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-3 rounded-lg">
              <AlertCircle size={16} />
              You have viewer permissions. Contact an admin to make changes.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
