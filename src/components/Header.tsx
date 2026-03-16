import React from 'react';
import { Search, Bell, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-emerald-50 bg-white sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500/50 text-sm"
            placeholder="Search crops, articles, or market updates..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
          <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-28">{user?.name ?? 'User'}</p>
            <p className="text-[11px] text-slate-500 truncate capitalize">{user?.role ?? ''}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
          >
            <LogOut size={16} />
          </button>
        </div>
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full">
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  );
}
