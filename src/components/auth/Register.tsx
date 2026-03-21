import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Tractor,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Sprout,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const { register } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
    phone: '',
    location: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.role) return setError(t('auth.register.roleRequired', 'Please select your role (Farmer or Buyer).'));
    if (form.password.length < 8) return setError(t('auth.register.passwordMin', 'Password must be at least 8 characters.'));
    if (form.password !== form.confirmPassword) return setError(t('auth.register.passwordMismatch', 'Passwords do not match.'));

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
        location: form.location.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.register.failed', 'Registration failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'farmer',
      label: t('role.farmer', 'Farmer'),
      icon: <Sprout className="w-5 h-5" />,
      desc: t('auth.register.role.farmerDesc', 'I grow crops and want market prices, disease detection & expert advice.'),
    },
    {
      value: 'buyer',
      label: t('role.buyer', 'Buyer'),
      icon: <ShoppingBag className="w-5 h-5" />,
      desc: t('auth.register.role.buyerDesc', 'I purchase agricultural produce and want to track prices & availability.'),
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2.5">
            <Tractor className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">AgroCare</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            {t('auth.register.leftTitleLine1', "Join India's")}<br />{t('auth.register.leftTitleLine2', 'Farming Community')}
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed mb-8">
            {t('auth.register.leftSubtitle', "Whether you're a farmer or a buyer, AgroCare gives you the tools and information you need to succeed in agriculture.")}
          </p>
          <div className="space-y-4">
            {[
              t('auth.register.feature.1', 'Real-time mandi prices across 500+ markets'),
              t('auth.register.feature.2', 'AI-powered crop disease detection'),
              t('auth.register.feature.3', 'Expert agricultural knowledge hub'),
              t('auth.register.feature.4', 'Dedicated AI chatbot for farmers'),
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-emerald-200 text-sm">
          {t('auth.register.footer', '© 2026 AgroCare. Serving farmers across India.')}
        </p>
      </div>

      {/* Right register form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg py-8"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="bg-emerald-600 rounded-lg p-2">
              <Tractor className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">AgroCare</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('auth.register.title', 'Create your account')}</h1>
            <p className="text-slate-500">{t('auth.register.subtitle', 'Join thousands of farmers and buyers on AgroCare')}</p>
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

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('auth.register.iAm', 'I am a')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: opt.value }))}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition ${
                      form.role === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        form.role === opt.value ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('auth.register.fullName', 'Full name')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder={t('auth.register.fullNamePlaceholder', 'Rajesh Kumar')}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('auth.email', 'Email address')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('auth.password', 'Password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder={t('auth.register.passwordPlaceholder', 'Min. 8 chars')}
                    className="w-full pl-10 pr-9 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('auth.register.confirm', 'Confirm')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder={t('auth.register.confirmPlaceholder', 'Repeat password')}
                    className="w-full pl-10 pr-9 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showConfirm ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('auth.register.phone', 'Phone')} <span className="text-slate-400 font-normal">({t('common.optional', 'optional')})</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('auth.register.location', 'Location')} <span className="text-slate-400 font-normal">({t('common.optional', 'optional')})</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="location"
                    type="text"
                    autoComplete="address-level2"
                    value={form.location}
                    onChange={set('location')}
                    placeholder="Village / District"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? t('auth.register.creating', 'Creating account…') : t('auth.register.create', 'Create account')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.register.haveAccount', 'Already have an account?')}{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-emerald-600 font-semibold hover:underline"
            >
              {t('auth.login.signIn', 'Sign in')}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
