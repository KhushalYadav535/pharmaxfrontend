'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1, title: 'Tour Plan Approved',
    message: 'Your tour plan for August has been approved by your manager.',
    time: '2 hours ago', type: 'success', isRead: false, group: 'Today',
  },
  {
    id: 2, title: 'Pending Daily Report',
    message: 'You have not submitted your daily report for yesterday.',
    time: '5 hours ago', type: 'warning', isRead: false, group: 'Today',
  },
  {
    id: 3, title: 'New Target Assigned',
    message: 'A new sales target has been assigned to your territory.',
    time: '1 day ago', type: 'info', isRead: true, group: 'Yesterday',
  },
  {
    id: 4, title: 'Expense Claim Processed',
    message: 'Your expense claim #EXP-0824 has been processed and disbursed.',
    time: '2 days ago', type: 'success', isRead: true, group: 'Earlier',
  },
  {
    id: 5, title: 'Upcoming Meeting',
    message: 'Reminder: Regional Sales Team Meeting tomorrow at 10:00 AM.',
    time: '3 days ago', type: 'info', isRead: true, group: 'Earlier',
  },
];

const TYPE_CONFIG = {
  success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', leftBorder: 'border-l-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', leftBorder: 'border-l-amber-500' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', leftBorder: 'border-l-blue-500' },
};

const GROUPS = ['Today', 'Yesterday', 'Earlier'];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500">Stay updated on your activities and alerts</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-8">
        {GROUPS.map((group) => {
          const groupItems = notifications.filter(n => n.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div key={group}>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">{group}</h2>
              <div className="space-y-3">
                {groupItems.map(item => {
                  const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
                  const Icon = config.icon;

                  return (
                    <div 
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        item.isRead ? 'bg-white border-gray-100 hover:border-gray-200' : `${config.bg} ${config.border} border-l-4 ${config.leftBorder} shadow-sm`
                      }`}
                    >
                      {!item.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                      
                      <div className={`p-2 rounded-lg flex-shrink-0 ${item.isRead ? 'bg-gray-50' : 'bg-white/60'}`}>
                        <Icon className={`w-5 h-5 ${item.isRead ? 'text-gray-400' : config.color}`} />
                      </div>
                      
                      <div className="flex-1 pr-6">
                        <h3 className={`text-sm font-semibold mb-1 ${item.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm leading-relaxed mb-2 ${item.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                          {item.message}
                        </p>
                        <span className="text-xs font-medium text-gray-400">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">No notifications</p>
          <p className="text-gray-500 text-sm">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
