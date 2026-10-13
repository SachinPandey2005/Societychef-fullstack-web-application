import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from './AuthContext';
import { apiClient } from '../../api/axios';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/admin-login', {
        email: trimmedIdentifier,
        password: trimmedPassword,
      });

      if (response.data.success && response.data.data?.session) {
        const { session, profile } = response.data.data;
        const userObj: User = {
          id: profile?.id || session.user?.id,
          name: profile?.name || trimmedIdentifier.split('@')[0] || 'Admin User',
          email: profile?.email || trimmedIdentifier,
          role: profile?.role || 'admin',
        };
        login(session.access_token, userObj);
        navigate('/');
      } else {
        setError(response.data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 401) {
        setError(apiMessage || 'Invalid email or password.');
      } else if (status === 403) {
        setError(apiMessage || 'Access denied: Ops or admin permissions required.');
      } else if (status === 500) {
        setError('Server error occurred during sign in. Please try again later.');
      } else {
        setError(apiMessage || 'Unable to connect to authentication server. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/30 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">SocietyChef Ops</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Enterprise Operations Console Sign In</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 p-3.5 rounded-2xl text-xs font-semibold mb-6 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Username or Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                placeholder="Admin@gmail.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
                placeholder="••••••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
