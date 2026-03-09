import React from 'react';
import { Search, Bell, Settings as SettingsIcon } from 'lucide-react';

export default function Header() {
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
