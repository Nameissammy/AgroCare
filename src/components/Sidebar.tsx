import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  BookOpen, 
  LogOut,
  Tractor
} from 'lucide-react';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

export default function Sidebar({ activeScreen, setActiveScreen }: SidebarProps) {
  const { user, logout } = useAuth();
  const navItems = [
    { id: 'dashboard' as Screen, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mandi-prices' as Screen, label: 'Mandi Prices', icon: TrendingUp },
    { id: 'disease-detection' as Screen, label: 'Disease Detection', icon: Search },
    { id: 'education' as Screen, label: 'Education', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-white border-r border-emerald-100 hidden md:flex flex-col sticky top-0 h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-emerald-600 rounded-lg p-2 text-white">
          <Tractor size={24} />
        </div>
        <div>
          <h1 className="text-emerald-700 text-xl font-bold tracking-tight">AgroCare</h1>
          <p className="text-xs text-slate-500 font-medium">Farmer's Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
              activeScreen === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-emerald-50">
        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
          <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
            {user?.name.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role ?? ''}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
