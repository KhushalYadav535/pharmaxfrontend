import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Field Pulse',
  description: 'Privacy Policy for Field Pulse CRM',
};

export default function PrivacyPolicy() {
  const lastUpdated = 'September 1, 2026';

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
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

      {/* Hero Section */}
      <div className="pt-32 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-slate prose-emerald lg:prose-lg max-w-none">
          <p className="lead text-xl text-slate-600 font-medium mb-8">
            At Field Pulse ("we", "our", or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Information We Collect</h2>
          <p className="text-slate-600 mb-4">We collect information that you provide directly to us when using the Field Pulse platform. This includes:</p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-8">
            <li><strong className="text-slate-800">Account Information:</strong> Name, email address, phone number, and professional details (such as role and territory).</li>
            <li><strong className="text-slate-800">Location Data:</strong> With your explicit permission, we collect precise background location data to enable GPS tracking for field visits, routing, and attendance (clock-in/clock-out).</li>
            <li><strong className="text-slate-800">Usage Data:</strong> Information about your interactions with the app, including call logs, visit reports, and daily summaries.</li>
            <li><strong className="text-slate-800">Device Information:</strong> Device model, operating system, unique device identifiers, battery status, and network state for diagnostic purposes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. How We Use Your Information</h2>
          <p className="text-slate-600 mb-4">We use the collected information for various purposes, including:</p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-8">
            <li>To provide, maintain, and improve our services.</li>
            <li>To track field force performance, attendance, and route optimization.</li>
            <li>To process and manage daily reports, expenses, and order bookings.</li>
            <li>To provide customer support and respond to inquiries.</li>
            <li>To monitor usage metrics and analyze trends to enhance the user experience.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. Data Sharing and Disclosure</h2>
          <p className="text-slate-600 mb-4">Your privacy is our priority. We do not sell your personal data. We may share your information only in the following circumstances:</p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-8">
            <li><strong className="text-slate-800">With Your Organization:</strong> As an enterprise tool, your data (including location and performance metrics) is shared with your employer or management team.</li>
            <li><strong className="text-slate-800">Service Providers:</strong> We may share data with third-party vendors who perform services on our behalf (e.g., cloud hosting, analytics).</li>
            <li><strong className="text-slate-800">Legal Requirements:</strong> If required by law, subpoena, or other legal processes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Location Tracking Policy</h2>
          <p className="text-slate-600 mb-8">
            Field Pulse relies on background location tracking to automate check-ins, verify visit locations, and optimize daily routes. Location data is only recorded during your active working hours (between your Clock In and Clock Out times). You can manage location permissions directly through your device settings, though revoking permissions may limit your ability to use core app functionalities.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Data Security</h2>
          <p className="text-slate-600 mb-8">
            We implement industry-standard administrative, technical, and physical security measures to protect your personal information. While no system is completely secure, we continually update our security practices to protect your data from unauthorized access, alteration, or disclosure.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">6. Changes to This Privacy Policy</h2>
          <p className="text-slate-600 mb-8">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">7. Contact Us</h2>
          <p className="text-slate-600 mb-8">
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact your organization's system administrator or reach out to us at:
            <br /><br />
            <a href="mailto:privacy@fieldpulse.app" className="text-emerald-600 font-semibold hover:text-emerald-700 underline underline-offset-2">privacy@fieldpulse.app</a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">FieldPulse</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Field Pulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
