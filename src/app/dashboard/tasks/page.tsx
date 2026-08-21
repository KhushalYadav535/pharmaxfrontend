import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Tasks | Pharmax',
};

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and view your tasks.</p>
        </div>
        <Link href="/dashboard/tasks/new" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"><Plus className="w-4 h-4" /> Create New</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-gray-500">No records found. Click 'Create New' to get started.</p>
      </div>
    </div>
  );
}
