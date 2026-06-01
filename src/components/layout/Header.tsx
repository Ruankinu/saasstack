import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, User, Settings, LogOut, Camera } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNavigate: (page: string) => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onNavigate, actions }) => {
  const { toggleSidebar, alerts, markAlertRead, currentUser, logout, updateUser, addToast } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    avatar: currentUser?.avatar || '',
    jobTitle: 'Product Manager',
    department: 'Operations',
    timezone: 'America/Sao_Paulo',
    notifications: 'all',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed);
  const recentAlerts = alerts.filter(a => !a.dismissed).slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileForm(prev => ({
        ...prev,
        name: currentUser.name,
        avatar: currentUser.avatar || '',
      }));
    }
  }, [currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileForm(prev => ({ ...prev, avatar: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    
    if (currentUser) {
      updateUser(currentUser.id, { 
        name: profileForm.name,
        avatar: profileForm.avatar || undefined,
      });
    }
    
    setSaving(false);
    setSaved(true);
    addToast({ type: 'success', title: 'Profile updated' });
    setTimeout(() => {
      setSaved(false);
      setShowProfileModal(false);
    }, 1000);
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 flex-shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Page Actions */}
            {actions}

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
              >
                <Bell size={20} />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Notifications</span>
                    <button
                      onClick={() => { onNavigate('alerts'); setShowNotifications(false); }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View all
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentAlerts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      recentAlerts.map(alert => (
                        <button
                          key={alert.id}
                          onClick={() => {
                            markAlertRead(alert.id);
                            onNavigate('alerts');
                            setShowNotifications(false);
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 transition-colors',
                            !alert.read && 'bg-primary-50/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', {
                              'bg-danger-500': alert.priority === 'critical',
                              'bg-warning-500': alert.priority === 'high',
                              'bg-primary-500': alert.priority === 'medium',
                              'bg-gray-400': alert.priority === 'low',
                            })} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Avatar name={currentUser?.name || ''} src={currentUser?.avatar} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name?.split(' ')[0]}</p>
                </div>
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in z-50">
                  {/* Profile header */}
                  <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar name={currentUser?.name || ''} src={currentUser?.avatar} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mt-1">
                          {currentUser?.role === 'admin' ? 'Admin' : 'Viewer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={() => { setShowProfileModal(true); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => { onNavigate('settings'); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} className="text-gray-400" />
                      Settings
                    </button>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Profile"
        size="md"
      >
        <div className="space-y-6">
          {/* Avatar section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={profileForm.name || currentUser?.name || ''} src={profileForm.avatar} size="xl" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-colors"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile Photo</p>
              <p className="text-xs text-gray-500">Click the camera icon to upload</p>
              {profileForm.avatar && (
                <button
                  onClick={() => setProfileForm(prev => ({ ...prev, avatar: '' }))}
                  className="text-xs text-danger-600 hover:text-danger-700 mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              value={currentUser?.email || ''}
              disabled
              helperText="Email cannot be changed"
            />
            <Input
              label="Job Title"
              placeholder="e.g. Product Manager"
              value={profileForm.jobTitle}
              onChange={e => setProfileForm(prev => ({ ...prev, jobTitle: e.target.value }))}
            />
            <Input
              label="Department"
              placeholder="e.g. Operations"
              value={profileForm.department}
              onChange={e => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
            />
            <Select
              label="Timezone"
              value={profileForm.timezone}
              onChange={e => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
              options={[
                { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
                { value: 'America/New_York', label: 'New York (GMT-5)' },
                { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
                { value: 'Europe/London', label: 'London (GMT+0)' },
                { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
                { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
              ]}
            />
            <Select
              label="Email Notifications"
              value={profileForm.notifications}
              onChange={e => setProfileForm(prev => ({ ...prev, notifications: e.target.value }))}
              options={[
                { value: 'all', label: 'All notifications' },
                { value: 'important', label: 'Important only' },
                { value: 'none', label: 'None' },
              ]}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} loading={saving}>
              {saved ? '✓ Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
