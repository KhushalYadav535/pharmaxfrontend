'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, FileText, ShoppingCart, 
  MapPin, Clock, LogOut, CheckSquare, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function CloseDayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  
  const [isClosing, setIsClosing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate day close blockers with backend
  const { data: closeCheck, isLoading: isCheckLoading } = useQuery({
    queryKey: ['day-close-check'],
    queryFn: () => api.get('/day/close-check').then(r => r.data?.data),
    staleTime: 5000,
  });

  const blockers: string[] = closeCheck?.blockers || [];
  const canClose: boolean = closeCheck?.canClose !== false;

  const closeMutation = useMutation({
    mutationFn: () => api.post('/day/close'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-attendance'] });
      qc.invalidateQueries({ queryKey: ['day-status'] });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to close day. Please check blockers.');
      setIsClosing(false);
    }
  });

  const handleCloseDay = () => {
    setIsClosing(true);
    closeMutation.mutate();
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center space-y-4">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Day Closed Successfully!</h1>
        <p className="text-gray-500">Your daily attendance, call reports, and operations have been finalized and signed off.</p>
        <p className="text-sm font-medium text-emerald-600">Redirecting to executive dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Close Day Verification</h1>
          <p className="text-sm text-gray-500">Review validation checks and finalize daily shift</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Field Compliance & Blocker Audit</h2>
            <p className="text-sm text-gray-500 mt-1">
              The system verifies that all field visits are reported, pending orders are synced, and attendance checkout is ready.
            </p>
          </div>
        </div>

        {isCheckLoading ? (
          <div className="py-6 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-xs">Running pre-close validations...</p>
          </div>
        ) : blockers.length > 0 ? (
          <div className="space-y-3">
            {blockers.map((blocker: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="flex-1">{blocker}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold">
            <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>All field compliance checks passed! You are ready to close your day.</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Confirm Final Checkout</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Closing your day logs your final GPS timestamp and submits your day's attendance to your Area Sales Manager.
        </p>
        <button
          onClick={handleCloseDay}
          disabled={isClosing}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {isClosing && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Confirm & Close Day</span>
        </button>
      </div>
    </div>
  );
}
