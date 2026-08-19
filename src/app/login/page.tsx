'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Loader2, Stethoscope } from 'lucide-react';

const ROLE_REDIRECT: Record<string, string> = {
  MR: '/dashboard',
  TRADE_REP: '/dashboard',
  DISTRIBUTOR_REP: '/dashboard',
  ASM: '/dashboard',
  RSM: '/dashboard',
  ZM: '/dashboard',
  NSM: '/dashboard',
  PRODUCT_MANAGER: '/dashboard',
  MARKETING: '/dashboard',
  SALES_ADMIN: '/dashboard',
  SUPER_ADMIN: '/dashboard',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Auth context will update user — redirect happens via useEffect below
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-bold">Px</span>
            </div>
            <span className="font-bold text-gray-900 text-xl">Pharmax</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-500 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@pharmax.com"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all placeholder:text-gray-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="login-btn"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-200 text-sm"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-500 mb-3 font-medium">Demo accounts (password: pharmax123)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Medical Rep', email: 'mr@pharmax.com' },
                { label: 'Sales Manager', email: 'asm@pharmax.com' },
                { label: 'NSM', email: 'nsm@pharmax.com' },
                { label: 'Super Admin', email: 'admin@pharmax.com' },
              ].map(({ label, email: demoEmail }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => { setEmail(demoEmail); setPassword('pharmax123'); }}
                  className="text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                >
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{demoEmail}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          New to Pharmax?{' '}
          <Link href="/signup" className="text-emerald-600 font-semibold hover:text-emerald-700">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
