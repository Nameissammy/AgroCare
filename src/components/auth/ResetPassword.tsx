import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Tractor,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ResetPasswordProps {
  initialToken?: string;
  onSwitchToLogin: () => void;
}

export default function ResetPassword({ initialToken = '', onSwitchToLogin }: ResetPasswordProps) {
  const { t } = useLanguage();
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError(t('auth.reset.tokenRequired', 'Reset token is required. Please use the link sent to your email.'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.reset.passwordMin', 'Password must be at least 8 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.reset.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || t('auth.reset.failed', 'Unable to reset password. Please try again.'));
      }

      setSuccess(data?.message || t('auth.reset.success', 'Password reset successful. You can sign in now.'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.reset.failed', 'Unable to reset password. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-emerald-600 rounded-lg p-2">
            <Tractor className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">AgroCare</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('auth.reset.title', 'Reset password')}</h1>
          <p className="text-slate-500">{t('auth.reset.subtitle', 'Set a new password for your account.')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              {success}
            </motion.div>
          )}

          <div>
            <label htmlFor="reset-token" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('auth.reset.token', 'Reset token')}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('auth.reset.tokenPlaceholder', 'Paste token from reset link')}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('auth.reset.newPassword', 'New password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.reset.newPasswordPlaceholder', 'Minimum 8 characters')}
                className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showNewPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('auth.reset.confirmPassword', 'Confirm new password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.reset.confirmPasswordPlaceholder', 'Repeat new password')}
                className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showConfirmPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? t('auth.reset.resetting', 'Resetting password…') : t('auth.reset.reset', 'Reset password')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backToSignIn', 'Back to sign in')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
