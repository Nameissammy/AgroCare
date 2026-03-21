import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tractor, Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

export default function ForgotPassword({ onSwitchToLogin }: ForgotPasswordProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError(t('auth.forgot.emailRequired', 'Email is required.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || t('auth.forgot.requestFailed', 'Unable to process request. Please try again.'));
      }

      setSuccess(data?.message || t('auth.forgot.success', 'If an account exists, a reset link has been sent.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgot.requestFailed', 'Unable to process request. Please try again.'));
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('auth.forgot.title', 'Forgot password')}</h1>
          <p className="text-slate-500">{t('auth.forgot.subtitle', 'Enter your email and we’ll send a reset link.')}</p>
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
            <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('auth.email', 'Email address')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? t('auth.forgot.sending', 'Sending link…') : t('auth.forgot.send', 'Send reset link')}
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
