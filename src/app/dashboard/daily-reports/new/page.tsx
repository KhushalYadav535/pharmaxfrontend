'use client';
import React, { useState } from 'react';
import DailyReportForm from '@/components/visits/DailyReportForm';

export default function Page() {
  const [visitType, setVisitType] = useState<'DOCTOR' | 'HOSPITAL' | 'RETAILER' | 'STOCKIST'>('DOCTOR');

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Daily Report</h1>
          <p className="text-gray-500">Fill out the details below to submit.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Report Type:</label>
          <select 
            value={visitType} 
            onChange={(e) => setVisitType(e.target.value as any)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="DOCTOR">Doctor</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="RETAILER">Retailer</option>
            <option value="STOCKIST">Stockist</option>
          </select>
        </div>
      </div>
      <DailyReportForm visitType={visitType} />
    </div>
  );
}
