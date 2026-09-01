import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Delete Account | Field Pulse',
  description: 'Request account deletion for your Field Pulse account',
};

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-black text-xl text-slate-800 tracking-tight">FieldPulse</span>
            </Link>
            <Link 
              href="/" 
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
            Account Deletion Request
          </h1>
          
          <div className="prose prose-slate prose-emerald mb-8">
            <p className="text-slate-600 text-lg leading-relaxed">
              To request the deletion of your Field Pulse account and all associated data, please follow the instructions below.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 mb-8">
              <h3 className="text-amber-800 font-bold m-0 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Important Information
              </h3>
              <p className="text-amber-700 text-sm m-0">
                Because Field Pulse is an enterprise application, your account is managed by your organization. Requesting account deletion will permanently remove your personal profile, but certain business records (like past visits or orders) may be retained by your employer for compliance purposes.
              </p>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">How to Delete Your Account</h2>
            <ol className="list-decimal pl-5 text-slate-600 space-y-4">
              <li>
                <strong>Option 1 (In-App):</strong> Open the Field Pulse mobile app, go to Settings &gt; Profile, and tap the "Delete Account" button at the bottom of the screen.
              </li>
              <li>
                <strong>Option 2 (Via Email):</strong> Send an email to our support team from your registered email address requesting account deletion.
              </li>
            </ol>
          </div>

          <a 
            href="mailto:support@fieldpulse.app?subject=Account Deletion Request"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
          >
            Email Support to Delete Account
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Field Pulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
