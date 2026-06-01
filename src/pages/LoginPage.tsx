import React, { useState } from 'react';
import { Mail, Lock, User, Building2, Eye, EyeOff, Link2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';

type Mode = 'login' | 'register' | 'invite';

export const LoginPage: React.FC = () => {
  const { login, register, joinWithInvite } = useStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setError('');
    setName('');
    setOrgName('');
    setInviteCode('');
    setInvitePassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 800));

    if (mode === 'register') {
      if (!name || !email || !password || !orgName) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      const success = register(name, email, password, orgName);
      if (!success) {
        setError('An account with this email already exists');
      }
    } else if (mode === 'invite') {
      if (!name || !email || !password || !inviteCode || !invitePassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      const success = joinWithInvite(name, email, password, inviteCode, invitePassword);
      if (!success) {
        setError('Invalid invite code or password. Please check and try again.');
      }
    } else {
      if (!email || !password) {
        setError('Please enter your email and password');
        setLoading(false);
        return;
      }
      const success = login(email, password);
      if (!success) {
        setError('Invalid credentials. Try admin@acme.com / password');
      }
    }
    setLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="fixed inset-0 flex">
      {/* Left panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Subscripto" className="w-11 h-11 rounded-2xl" />
            <span className="text-2xl font-bold text-white">Subscripto</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Take control of your
            <span className="block text-blue-200">SaaS spending</span>
          </h1>
          <p className="text-base text-blue-100/80 max-w-sm leading-relaxed">
            Track, manage, and optimize all your software subscriptions in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { value: '$2.4M+', label: 'Savings identified' },
              { value: '1,200+', label: 'Teams onboarded' },
              { value: '98%', label: 'Customer satisfaction' },
              { value: '15min', label: 'Average setup time' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl px-3 py-2.5">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <img src="/logo.png" alt="Subscripto" className="w-9 h-9 rounded-xl" />
              <span className="text-lg font-bold text-gray-900">Subscripto</span>
            </div>

            {/* Back button for register/invite modes */}
            {mode !== 'login' && (
              <button
                onClick={() => switchMode('login')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create account'}
              {mode === 'invite' && 'Join with invite'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {mode === 'login' && 'Sign in to your dashboard'}
              {mode === 'register' && 'Start a new organization'}
              {mode === 'invite' && 'Enter your invite code'}
            </p>

            {/* Social login - only on login */}
            {mode === 'login' && (
              <>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white">
                    <svg viewBox="0 0 23 23" width="16" height="16">
                      <path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/>
                      <path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#ffb900" d="M12 12h10v10H12z"/>
                    </svg>
                    Microsoft
                  </button>
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 text-gray-400">
                      or with email
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Invite code fields */}
              {mode === 'invite' && (
                <>
                  <Input
                    label="Invite Code"
                    placeholder="XXXXXXXX"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    icon={<Link2 size={15} />}
                  />
                  <Input
                    label="Invite Password"
                    placeholder="From your admin"
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    icon={<Lock size={15} />}
                  />
                  <hr className="border-gray-200 !my-4" />
                </>
              )}

              {/* Name field for register/invite */}
              {(mode === 'register' || mode === 'invite') && (
                <Input
                  label="Full Name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  icon={<User size={15} />}
                />
              )}

              {/* Org name only for register */}
              {mode === 'register' && (
                <Input
                  label="Organization"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  icon={<Building2 size={15} />}
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={15} />}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={<Lock size={15} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 w-3.5 h-3.5" defaultChecked />
                    Remember me
                  </label>
                  <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-danger-50 text-danger-700 text-xs px-3 py-2.5 rounded-lg border border-danger-200">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="md">
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'invite' && 'Join Team'}
              </Button>
            </form>

            {/* Mode switchers */}
            {mode === 'login' && (
              <div className="mt-4 space-y-2 text-center">
                <p className="text-xs text-gray-500">
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('register')} className="text-primary-600 hover:text-primary-700 font-semibold">
                    Sign up
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Have an invite?{' '}
                  <button onClick={() => switchMode('invite')} className="text-primary-600 hover:text-primary-700 font-semibold">
                    Join team
                  </button>
                </p>
              </div>
            )}

            {mode !== 'login' && (
              <p className="mt-4 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-primary-600 hover:text-primary-700 font-semibold">
                  Sign in
                </button>
              </p>
            )}

            {mode === 'login' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-0.5">Demo</p>
                <p className="text-xs text-blue-600">
                  <strong>admin@acme.com</strong> (Owner) · <strong>viewer@acme.com</strong> (Viewer)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
