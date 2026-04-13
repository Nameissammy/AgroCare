import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  BookOpen, 
  PenSquare,
  ChevronLeft,
  ChevronRight,
  Tractor
} from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function Sidebar({ activeScreen, setActiveScreen, isExpanded, onToggleExpand }: SidebarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard' as Screen, label: t('sidebar.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'mandi-prices' as Screen, label: t('sidebar.mandiPrices', 'Mandi Prices'), icon: TrendingUp },
    { id: 'disease-detection' as Screen, label: t('sidebar.diseaseDetection', 'Disease Detection'), icon: Search },
    { id: 'education' as Screen, label: t('sidebar.education', 'Education'), icon: BookOpen },
    ...(user?.role === 'admin'
      ? [{ id: 'creator-studio' as Screen, label: t('sidebar.creatorStudio', 'Creator Studio'), icon: PenSquare }]
      : []),
  ];

  return (
    <aside
      className={`relative z-20 overflow-visible bg-white border-r border-emerald-100 hidden md:flex flex-col sticky top-0 h-screen transition-all duration-200 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <button
        onClick={onToggleExpand}
        title={isExpanded ? t('sidebar.collapse', 'Collapse menu') : t('sidebar.expand', 'Expand menu')}
        aria-label={isExpanded ? t('sidebar.collapse', 'Collapse menu') : t('sidebar.expand', 'Expand menu')}
        className="absolute right-0 top-6 z-30 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {isExpanded ? <ChevronLeft size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
      </button>

      <div className={`p-6 flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
        <div className="bg-emerald-600 rounded-lg p-2 text-white">
          <Tractor size={24} />
        </div>
        <div className={isExpanded ? 'block' : 'hidden'}>
          <h1 className="text-emerald-700 text-xl font-bold tracking-tight">AgroCare</h1>
          <p className="text-xs text-slate-500 font-medium">{t('sidebar.portal', "Farmer's Portal")}</p>
        </div>
      </div>

      <nav className={`flex-1 ${isExpanded ? 'px-4' : 'px-2'} space-y-1`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            title={!isExpanded ? item.label : undefined}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 justify-start px-3' : 'justify-center px-2'} py-2.5 rounded-lg transition-colors font-medium ${
              activeScreen === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            <item.icon size={20} />
            <span className={isExpanded ? 'inline' : 'hidden'}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
