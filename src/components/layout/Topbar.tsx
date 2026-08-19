'use client';

import { useState } from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getInitials, formatRole } from '@/lib/utils';

export default function Topbar() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors, retailers, visits..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-gray-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500">{formatRole(user.role)}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {getInitials(user.firstName, user.lastName)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
