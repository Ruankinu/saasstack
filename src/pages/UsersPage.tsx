import React, { useState } from 'react';
import { Plus, Users, Shield, Eye, Crown, MoreVertical, Trash2, Copy, Check, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store/useStore';
import { UserRole } from '@/types';
import { format } from 'date-fns';

interface UsersPageProps {
  onNavigate: (page: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const { users, currentUser, updateUserRole, deleteUser, invites, createInvite, deleteInvite, addToast } = useStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [createdInvite, setCreatedInvite] = useState<{ code: string; password: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin' || isOwner;
  const activeInvites = invites.filter(i => !i.used);

  // Permission helpers
  const canManageUser = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true; // Owner can manage everyone
    if (currentUser.role === 'admin' && targetRole === 'viewer') return true; // Admin can manage viewers
    return false;
  };

  const canChangeRoleTo = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return targetRole !== 'owner'; // Owner can set admin or viewer
    if (currentUser.role === 'admin') return targetRole === 'viewer'; // Admin can only set viewer
    return false;
  };

  const getAvailableRoles = (): { value: string; label: string }[] => {
    if (isOwner) {
      return [
        { value: 'viewer', label: 'Viewer — Read-only access' },
        { value: 'admin', label: 'Admin — Manage subscriptions & settings' },
      ];
    }
    return [
      { value: 'viewer', label: 'Viewer — Read-only access' },
    ];
  };

  const handleCreateInvite = () => {
    const invite = createInvite(inviteRole);
    setCreatedInvite({ code: invite.code, password: invite.password });
  };

  const copyToClipboard = (text: string, type: 'code' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
    addToast({ type: 'success', title: 'Copied to clipboard' });
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
    setDeleteConfirm(null);
    setOpenMenu(null);
    addToast({ type: 'success', title: 'Member removed' });
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateUserRole(userId, role);
    setOpenMenu(null);
    addToast({ type: 'success', title: 'Role updated' });
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setCreatedInvite(null);
    setInviteRole('viewer');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Badge variant="warning" dot>Owner</Badge>;
      case 'admin':
        return <Badge variant="default" dot>Admin</Badge>;
      default:
        return <Badge variant="neutral" dot>Viewer</Badge>;
    }
  };



  return (
    <div className="min-h-full bg-gray-50/50">
      <Header
        title="Team Members"
        subtitle={`${users.length} member${users.length !== 1 ? 's' : ''} in your organization`}
        onNavigate={onNavigate}
        actions={
          isAdmin ? (
            <Button onClick={() => setShowInviteModal(true)} icon={<Plus size={16} />} className="ml-2">
              Invite Member
            </Button>
          ) : undefined
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
        {/* Role explanation */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center text-warning-600 flex-shrink-0">
                <Crown size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Owner</h4>
                <p className="text-xs text-gray-500 mt-0.5">Full control. Manage team, billing, and delete organization.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Admin</h4>
                <p className="text-xs text-gray-500 mt-0.5">Manage subscriptions, settings, and invite viewers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                <Eye size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Viewer</h4>
                <p className="text-xs text-gray-500 mt-0.5">Read-only access to view data and reports.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Invites */}
        {isAdmin && activeInvites.length > 0 && (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={16} className="text-primary-600" />
              <h4 className="text-sm font-semibold text-gray-900">Pending Invites</h4>
            </div>
            <div className="space-y-2">
              {activeInvites.map(invite => (
                <div key={invite.code} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-900">{invite.code}</span>
                    {getRoleBadge(invite.role)}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      Created {format(new Date(invite.createdAt), 'MMM d')}
                    </span>
                    <button
                      onClick={() => {
                        deleteInvite(invite.code);
                        addToast({ type: 'success', title: 'Invite removed' });
                      }}
                      className="p-1 rounded text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                      title="Delete invite"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Users List */}
        {users.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users size={28} />}
              title="No team members"
              description="Invite team members to collaborate on subscription management."
              actionLabel={isAdmin ? "Invite Member" : undefined}
              onAction={isAdmin ? () => setShowInviteModal(true) : undefined}
            />
          </Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-gray-100">
              {users.map(user => {
                const canManage = canManageUser(user.role) && user.id !== currentUser?.id;
                
                return (
                  <div
                    key={user.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Avatar */}
                    <Avatar name={user.name} src={user.avatar} size="md" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        {user.id === currentUser?.id && (
                          <Badge variant="info">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.lastLogin && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last active: {format(new Date(user.lastLogin), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Role Badge + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getRoleBadge(user.role)}

                      {/* Actions */}
                      {canManage ? (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenu === user.id && (
                            <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-10 animate-fade-in">
                              {/* Role change options */}
                              {user.role !== 'admin' && canChangeRoleTo('admin') && (
                                <button
                                  onClick={() => handleRoleChange(user.id, 'admin')}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Shield size={14} /> Make Admin
                                </button>
                              )}
                              {user.role !== 'viewer' && canChangeRoleTo('viewer') && (
                                <button
                                  onClick={() => handleRoleChange(user.id, 'viewer')}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Eye size={14} /> Make Viewer
                                </button>
                              )}
                              
                              <hr className="my-1 border-gray-100" />
                              
                              {/* Delete */}
                              {deleteConfirm === user.id ? (
                                <div className="px-4 py-2 space-y-2">
                                  <p className="text-xs text-danger-600 font-medium">Remove this member?</p>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)}>Yes</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                                >
                                  <Trash2 size={14} /> Remove Member
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={closeInviteModal}
        title={createdInvite ? "Invite Created!" : "Invite Team Member"}
      >
        {createdInvite ? (
          <div className="space-y-4">
            <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 text-center">
              <p className="text-sm text-accent-700 mb-2">Share these credentials with your team member</p>
              <p className="text-xs text-accent-600">They can use them on the login page to join your organization</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invite Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg text-center tracking-wider">
                    {createdInvite.code}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(createdInvite.code, 'code')}
                    icon={copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  >
                    {copiedCode ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invite Password</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg text-center">
                    {createdInvite.password}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(createdInvite.password, 'password')}
                    icon={copiedPassword ? <Check size={14} /> : <Copy size={14} />}
                  >
                    {copiedPassword ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <p className="text-xs text-warning-700">
                <strong>Important:</strong> This invite can only be used once. The code and password won't be shown again.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button onClick={closeInviteModal}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create an invite code that your team member can use to join your organization.
            </p>

            <Select
              label="Role"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as UserRole)}
              options={getAvailableRoles()}
            />

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">How it works</h4>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Click "Generate Invite" to create a unique code and password</li>
                <li>Share the credentials with your team member</li>
                <li>They click "Join with Invite" on the login page</li>
                <li>They enter the code, password, and their info to join</li>
              </ol>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={closeInviteModal}>Cancel</Button>
              <Button onClick={handleCreateInvite} icon={<Link2 size={16} />}>Generate Invite</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
