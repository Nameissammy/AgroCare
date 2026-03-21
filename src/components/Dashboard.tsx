import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { 
  CloudRain, 
  Lightbulb, 
  ArrowUpRight, 
  ArrowDownRight, 
  Camera, 
  Calendar, 
  TrendingUp, 
  Wallet, 
  CheckCircle2,
  ChevronRight,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

const DAILY_TIP_STORAGE_KEY = 'agrocare_daily_tip';
const DAILY_TIP_REFRESH_MS = 24 * 60 * 60 * 1000;
const DEFAULT_FALLBACK_TIP =
  'Rotate your wheat crops with legumes to naturally enrich soil nitrogen levels and reduce the need for fertilizers next season.';

type TipSource = 'ai' | 'fallback' | 'local' | 'default';

interface DailyTipState {
  tip: string;
  source: TipSource;
  fetchedAt: string;
}

const getDefaultTipState = (): DailyTipState => ({
  tip: DEFAULT_FALLBACK_TIP,
  source: 'default',
  fetchedAt: new Date().toISOString(),
});

const getTipStorageKey = (language: string) => `${DAILY_TIP_STORAGE_KEY}_${language}`;

const readStoredTip = (language: string): DailyTipState | null => {
  try {
    const raw = localStorage.getItem(getTipStorageKey(language));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.tip || typeof parsed.tip !== 'string') {
      return null;
    }

    return {
      tip: parsed.tip,
      source: 'local',
      fetchedAt: typeof parsed.fetchedAt === 'string' ? parsed.fetchedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const persistTip = (language: string, tipState: DailyTipState) => {
  try {
    localStorage.setItem(
      getTipStorageKey(language),
      JSON.stringify({
        tip: tipState.tip,
        fetchedAt: tipState.fetchedAt,
      })
    );
  } catch {
    // no-op: localStorage unavailable
  }
};

export default function Dashboard({ setActiveScreen }: { setActiveScreen: (s: Screen) => void }) {
  const { language, t } = useLanguage();
  const [showForecast, setShowForecast] = useState(false);
  const [forecast, setForecast] = useState<Array<any>>([]);
  const [dailyTip, setDailyTip] = useState<DailyTipState>(() => readStoredTip(language) || getDefaultTipState());

  // generate a deterministic 7-day forecast (frontend-only)
  useEffect(() => {
    const today = new Date();
    const baseTemp = 28; // matches hero default
    // simple seeded generator for variance
    const seed = baseTemp + today.getDate();
    const rnd = (n: number) => Math.abs(Math.sin(seed + n) * 100) % 10;

    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const high = Math.round(baseTemp + rnd(i) + (i % 2 === 0 ? 1 : -1) * (i * 0.3));
      const low = Math.round(high - (2 + (rnd(i + 3) % 4)));
      const humidity = Math.round(40 + rnd(i + 1) * 5 + (i % 3) * 2);
      const cond = humidity > 60 ? 'Clouds' : humidity > 50 ? 'Partly Cloudy' : 'Sunny';
      return {
        date: date.toISOString(),
        high,
        low,
        humidity,
        cond,
      };
    });
    setForecast(days);
  }, []);

  useEffect(() => {
    let mounted = true;
    setDailyTip(readStoredTip(language) || getDefaultTipState());

    const fetchTip = async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`/api/tips/daily?language=${encodeURIComponent(language)}`, { signal });
        if (!response.ok) {
          throw new Error(`Unable to fetch daily tip (${response.status})`);
        }

        const data = await response.json();
        const nextTip: DailyTipState = {
          tip: typeof data?.tip === 'string' && data.tip.trim() ? data.tip.trim() : DEFAULT_FALLBACK_TIP,
          source: data?.source === 'ai' || data?.source === 'fallback' ? data.source : 'fallback',
          fetchedAt: typeof data?.fetchedAt === 'string' ? data.fetchedAt : new Date().toISOString(),
        };

        if (!mounted) {
          return;
        }

        setDailyTip(nextTip);
        persistTip(language, nextTip);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        if (!mounted) {
          return;
        }

        const localTip = readStoredTip(language);
        setDailyTip(localTip || getDefaultTipState());
      }
    };

    const controller = new AbortController();
    fetchTip(controller.signal);

    const interval = setInterval(() => {
      fetchTip();
    }, DAILY_TIP_REFRESH_MS);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [language]);

  const todayHumidity = forecast.length ? forecast[0].humidity : 45;

  return (
    <div className="p-4 md:p-8 space-y-8 overflow-y-auto">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-emerald-600 p-8 text-white flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="z-10">
            <h2 className="text-4xl font-black mb-2">28°C {t('dashboard.weather.sunny', 'Sunny')}</h2>
            <p className="text-white/80 font-medium">{t('dashboard.weather.subtitle', 'Perfect weather for wheat harvesting in your region today.')}</p>
          </div>
          <div className="z-10 mt-6 flex items-center gap-4">
            <button
              onClick={() => setShowForecast((s) => !s)}
              className="bg-white text-emerald-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors"
            >
              {showForecast ? t('dashboard.forecast.hide', 'Hide 7-Day Forecast') : t('dashboard.forecast.view', 'View 7-Day Forecast')}
            </button>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <CloudRain size={18} />
              <span>{t('dashboard.humidity', 'Humidity')}: {todayHumidity}%</span>
            </div>
          </div>
        </motion.div>

        {showForecast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50">
              <h4 className="font-bold mb-3">{t('dashboard.forecast.title', '7-Day Forecast')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {forecast.map((d, idx) => {
                  const date = new Date(d.date);
                  const day = date.toLocaleDateString(undefined, { weekday: 'short' });
                  const conditionText =
                    d.cond === 'Clouds'
                      ? t('dashboard.weather.clouds', 'Clouds')
                      : d.cond === 'Partly Cloudy'
                        ? t('dashboard.weather.partlyCloudy', 'Partly Cloudy')
                        : t('dashboard.weather.sunny', 'Sunny');
                  return (
                    <div key={idx} className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-center">
                      <div className="text-xs font-semibold">{day}</div>
                      <div className="text-sm font-bold mt-1">{d.high}° / {d.low}°</div>
                      <div className="text-xs text-slate-600 mt-1">{conditionText}</div>
                      <div className="text-xs mt-2">{t('dashboard.humidity', 'Humidity')}: <span className="font-semibold">{d.humidity}%</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex flex-col justify-center"
        >
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="text-emerald-600" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">{t('dashboard.dailyTip', 'Daily Farmer Tip')}</span>
          </div>
          <p className="text-slate-700 font-medium leading-relaxed">
            {dailyTip.tip}
          </p>
          <p className="text-xs text-slate-500 mt-3">
            {dailyTip.source === 'ai'
              ? t('dashboard.tip.live', 'Updated with live AI tip.')
              : dailyTip.source === 'local'
                ? t('dashboard.tip.saved', 'Using last saved tip.')
                : t('dashboard.tip.fallback', 'Using fallback tip.')}
          </p>
        </motion.div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Live Mandi Prices */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">{t('dashboard.mandi.title', 'Live Mandi Prices')}</h3>
            <button
              onClick={() => setActiveScreen('mandi-prices')}
              className="text-emerald-600 text-sm font-semibold hover:underline flex items-center gap-1"
            >
              {t('dashboard.viewAll', 'View All')} <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: t('dashboard.crop.wheat', 'Wheat'), price: '₹2,125', trend: '+2.4%', up: true, icon: '🌾', color: 'bg-orange-50 text-orange-600' },
              { name: t('dashboard.crop.rice', 'Rice'), price: '₹1,950', trend: '-0.8%', up: false, icon: '🍚', color: 'bg-yellow-50 text-yellow-600' },
              { name: t('dashboard.crop.tomato', 'Tomato'), price: '₹3,400', trend: '+5.2%', up: true, icon: '🍅', color: 'bg-red-50 text-red-600' },
            ].map((crop, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`size-10 ${crop.color} rounded-lg flex items-center justify-center text-xl`}>
                    {crop.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{crop.name}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.perQuintal', 'Per Quintal')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{crop.price}</p>
                  <p className={`text-xs flex items-center justify-end font-medium ${crop.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {crop.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {crop.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disease Detection CTA */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-50 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Search className="text-emerald-600" size={20} />
            <h3 className="font-bold text-lg">{t('dashboard.cropHealth.title', 'Crop Health AI')}</h3>
          </div>
          <div className="flex-1 bg-emerald-50/50 rounded-xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center p-6 text-center">
            <div className="size-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-emerald-600">
              <Camera size={32} />
            </div>
            <p className="text-sm font-bold mb-1">{t('dashboard.cropHealth.prompt', 'Spot something unusual?')}</p>
            <p className="text-xs text-slate-500 mb-4">{t('dashboard.cropHealth.subtitle', 'Upload a photo of your crop to diagnose pests and diseases instantly.')}</p>
            <button
              onClick={() => setActiveScreen('disease-detection')}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              {t('dashboard.cropHealth.action', 'Diagnose Your Crop Now')}
            </button>
          </div>
        </div>

        {/* Knowledge Hub */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">{t('dashboard.knowledge.title', 'Knowledge Hub')}</h3>
            <button
              onClick={() => setActiveScreen('education')}
              className="text-emerald-600 text-sm font-semibold hover:underline"
            >
              {t('dashboard.readAll', 'Read All')}
            </button>
          </div>
          <div className="space-y-4">
            {[
              { 
                title: t('dashboard.article.1.title', 'Organic Pest Control: 5 Natural Methods for 2024'), 
                meta: t('dashboard.article.1.meta', '4 min read • Agriculture'),
                img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=100&h=100&fit=crop'
              },
              { 
                title: t('dashboard.article.2.title', 'Smart Irrigation Systems: Reducing Water Waste'), 
                meta: t('dashboard.article.2.meta', '6 min read • Tech'),
                img: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=100&h=100&fit=crop'
              },
              { 
                title: t('dashboard.article.3.title', 'Understanding Soil pH: A Guide for Wheat Farmers'), 
                meta: t('dashboard.article.3.meta', '8 min read • Soil Science'),
                img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=100&h=100&fit=crop'
              },
            ].map((article, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className="size-16 rounded-lg overflow-hidden shrink-0">
                  <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{article.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Summary Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.stats.seasonProgress', 'Season Progress'), value: t('dashboard.stats.seasonValue', 'Day 42/90'), icon: Calendar, color: 'bg-blue-50 text-blue-600' },
          { label: t('dashboard.stats.yieldPrediction', 'Yield Prediction'), value: t('dashboard.stats.yieldValue', '+12% vs LY'), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: t('dashboard.stats.estimatedIncome', 'Estimated Income'), value: t('dashboard.stats.incomeValue', '₹4.2 Lakhs'), icon: Wallet, color: 'bg-orange-50 text-orange-600' },
          { label: t('dashboard.stats.governmentSubsidy', 'Government Subsidy'), value: t('dashboard.stats.subsidyValue', 'Active'), icon: CheckCircle2, color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-emerald-50 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
