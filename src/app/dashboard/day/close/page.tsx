'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, FileText, ShoppingCart, 
  MapPin, Clock, LogOut, CheckSquare
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function CloseDayPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isClosing, setIsClosing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mocked pending items
  const pendingItems = [
    { id: 1, type: 'expense', title: 'Unsubmitted Expenses', description: 'You have 2 expenses not submitted', action: 'Submit Now', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 2, type: 'order', title: 'Pending Orders', description: '1 order is saved as draft', action: 'Review', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const handleCloseDay = () => {
    setIsClosing(true);
    // Simulate API call
    setTimeout(() => {
      setIsClosing(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }, 1500);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Day Closed Successfully!</h1>
        <p className="text-gray-500 mb-8">Great job today, {user?.firstName}. Have a good rest!</p>
        <p className="text-sm font-medium text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Close Day</h1>
          <p className="text-sm text-gray-500">Confirm pending tasks and check out</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm mb-8">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pending Actions</h2>
            <p className="text-sm text-gray-500 mt-1">Please review the following items before closing your day.</p>
          </div>
        </div>

        <div className="space-y-4">
          {pendingItems.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <button className="px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                {item.action}
              </button>
            </div>
          ))}
          {pendingItems.length === 0 && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-700 font-semibold">
              <CheckSquare className="w-5 h-5" />
              No pending actions. You are good to go!
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
        <h3 className="font-bold text-slate-800 mb-4 text-center">Ready to Check Out?</h3>
        <p className="text-sm text-slate-500 text-center mb-8 max-w-sm mx-auto">
          Closing your day will mark your final attendance for today. Any further calls will be recorded for tomorrow.
        </p>

        <button
          onClick={handleCloseDay}
          disabled={isClosing}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
        >
          {isClosing ? (
            <>
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              Closing Day...
            </>
          ) : (
            <>
              <LogOut className="w-6 h-6" />
              Confirm & Close Day
            </>
          )}
        </button>
      </div>
    </div>
  );
}
