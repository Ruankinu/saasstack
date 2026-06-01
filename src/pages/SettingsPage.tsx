import React, { useState } from 'react';
import { Building2, DollarSign, Bell, Save, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'BRL', label: 'BRL (R$) - Brazilian Real' },
  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { organization, updateOrganization, currentUser } = useStore();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const [form, setForm] = useState({
    name: organization.name,
    currency: organization.currency,
    monthlyBudget: organization.monthlyBudget.toString(),
    yearlyBudget: organization.yearlyBudget.toString(),
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    renewal30: true,
    renewal15: true,
    renewal7: true,
    renewal3: true,
    budgetWarning: true,
    expiredActive: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    updateOrganization({
      name: form.name,
      currency: form.currency,
      monthlyBudget: parseFloat(form.monthlyBudget) || 0,
      yearlyBudget: parseFloat(form.yearlyBudget) || 0,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const syncYearlyBudget = (monthly: string) => {
    const m = parseFloat(monthly);
    if (!isNaN(m)) {
      setForm(prev => ({ ...prev, monthlyBudget: monthly, yearlyBudget: (m * 12).toString() }));
    } else {
      setForm(prev => ({ ...prev, monthlyBudget: monthly }));
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title="Settings"
        subtitle="Manage your organization preferences"
        onNavigate={onNavigate}
      />

      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto space-y-6">
        {/* Organization */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Organization</h3>
              <p className="text-xs text-gray-500">Basic information about your company</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isAdmin}
            />
            <Select
              label="Currency"
              value={form.currency}
              onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
              options={CURRENCIES}
              disabled={!isAdmin}
            />
          </div>
        </Card>

        {/* Budget */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center text-accent-600">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Budget Limits</h3>
              <p className="text-xs text-gray-500">Set spending thresholds for alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monthly Budget"
              type="number"
              min="0"
              step="100"
              value={form.monthlyBudget}
              onChange={e => syncYearlyBudget(e.target.value)}
              helperText="Budget warning at 85% and 100%"
              disabled={!isAdmin}
            />
            <Input
              label="Yearly Budget"
              type="number"
              min="0"
              step="1000"
              value={form.yearlyBudget}
              onChange={e => setForm(prev => ({ ...prev, yearlyBudget: e.target.value }))}
              helperText="Auto-calculated from monthly × 12"
              disabled={!isAdmin}
            />
          </div>
        </Card>

        {/* Alert Preferences */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center text-warning-600">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Alert Preferences</h3>
              <p className="text-xs text-gray-500">Configure when to receive notifications</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal Reminders</p>
            {[
              { key: 'renewal30', label: '30 days before renewal' },
              { key: 'renewal15', label: '15 days before renewal' },
              { key: 'renewal7', label: '7 days before renewal' },
              { key: 'renewal3', label: '3 days before renewal' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer group">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={alertSettings[item.key as keyof typeof alertSettings]}
                    onChange={e => setAlertSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="sr-only peer"
                    disabled={!isAdmin}
                  />
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors",
                    alertSettings[item.key as keyof typeof alertSettings] ? "bg-primary-500" : "bg-gray-200",
                    !isAdmin && "opacity-50"
                  )} />
                  <div className={cn(
                    "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    alertSettings[item.key as keyof typeof alertSettings] && "translate-x-5"
                  )} />
                </div>
              </label>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Other Alerts</p>
              {[
                { key: 'budgetWarning', label: 'Budget threshold warnings' },
                { key: 'expiredActive', label: 'Expired subscriptions still marked active' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={alertSettings[item.key as keyof typeof alertSettings]}
                      onChange={e => setAlertSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="sr-only peer"
                      disabled={!isAdmin}
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      alertSettings[item.key as keyof typeof alertSettings] ? "bg-primary-500" : "bg-gray-200",
                      !isAdmin && "opacity-50"
                    )} />
                    <div className={cn(
                      "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      alertSettings[item.key as keyof typeof alertSettings] && "translate-x-5"
                    )} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </Card>



        {/* Save Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              loading={saving}
              icon={saved ? <Check size={16} /> : <Save size={16} />}
              className={cn(saved && 'bg-accent-600 hover:bg-accent-700')}
            >
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
