'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Send, AlertCircle, ChevronDown, Bell, User, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface TaskFormProps {
  userList?: { id: string; firstName: string; lastName: string }[];
  onSuccess?: () => void;
}

const TASK_TYPES = [
  { id: 'CALL',  label: 'Call',  color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-400' },
  { id: 'EMAIL', label: 'Email', color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-400'  },
  { id: 'TODO',  label: 'To-do', color: 'text-gray-700',  bg: 'bg-gray-100', border: 'border-gray-400'  },
];

const PRIORITIES = [
  { id: 'LOW',    label: 'Low',    dot: 'bg-emerald-500', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400' },
  { id: 'MEDIUM', label: 'Medium', dot: 'bg-amber-500',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-400'   },
  { id: 'HIGH',   label: 'High',   dot: 'bg-red-500',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-400'     },
];

const REMINDER_OPTIONS = [
  '15 minutes before', '30 minutes before', '1 hour before',
  '1 day before', '2 days before', 'At time of due date',
];

const RING = '#7c3aed33';

export default function TaskForm({ userList = [], onSuccess }: TaskFormProps) {
  const router = useRouter();

  const [title, setTitle]           = useState('');
  const [type, setType]             = useState<'CALL'|'EMAIL'|'TODO'>('TODO');
  const [priority, setPriority]     = useState<'LOW'|'MEDIUM'|'HIGH'>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [queue, setQueue]           = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [reminder, setReminder]     = useState('');
  const [notes, setNotes]           = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const lower = val.toLowerCase();
    if (lower.includes('call')) setType('CALL');
    else if (lower.includes('email')) setType('EMAIL');
    else setType('TODO');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/tasks', {
        title, type, priority,
        assignedToId: assignedToId || undefined,
        queue: queue || undefined,
        dueDate: dueDate || undefined,
        reminder: reminder || undefined,
        notes: notes || undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/tasks');
    } catch (e: any) { setError(e.message || 'Failed to create task'); }
    finally { setIsSubmitting(false); }
  };

  const inputCls = `w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all`;
  const selectCls = `${inputCls} appearance-none cursor-pointer font-semibold`;
  const labelCls = `block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide`;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">New Task</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Task Entry</p>
        </div>
        <CheckCircle className="w-6 h-6 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Title — full width, auto-detects type */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className={labelCls}>
            Title <span className="text-red-500">*</span>
            <span className="ml-1 font-medium text-gray-400 normal-case tracking-normal">(Type "call" or "email" to auto-set type)</span>
          </label>
          <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
            placeholder="Enter task name..."
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* Type */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {TASK_TYPES.map((t: any) => (
              <button key={t.id} onClick={() => setType(t.id as any)}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-bold transition-all shadow-sm hover:shadow-md ${type === t.id ? `border-2 ${t.border} ${t.bg} ${t.color}` : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="md:col-span-2 lg:col-span-2">
          <label className={labelCls}>Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p: any) => (
              <button key={p.id} onClick={() => setPriority(p.id as any)}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${priority === p.id ? `border-2 ${p.border} ${p.bg} ${p.color}` : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className={labelCls}>Assigned To</label>
          <div className="relative group">
            <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)}
              className={`${selectCls} pl-12`} style={{ '--tw-ring-color': RING } as any}>
              <option value="" className="text-gray-400">Select user...</option>
              {userList.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
            <User className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Queue */}
        <div>
          <label className={labelCls}>Queue</label>
          <input type="text" value={queue} onChange={e => setQueue(e.target.value)}
            placeholder="Task queue name (optional)..."
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* Due Date */}
        <div>
          <label className={labelCls}>Due Date</label>
          <div className="relative">
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Task Reminder */}
        <div>
          <label className={labelCls}>
            Task Reminder <span className="font-medium text-gray-400 normal-case tracking-normal">(Send email)</span>
          </label>
          <div className="relative group">
            <select value={reminder} onChange={e => setReminder(e.target.value)}
              className={`${selectCls} pl-12`} style={{ '--tw-ring-color': RING } as any}>
              <option value="" className="text-gray-400">No reminder</option>
              {REMINDER_OPTIONS.map((r: any) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Bell className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Notes — full width */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className={labelCls}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Enter details about your task..."
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all"
            style={{ '--tw-ring-color': RING } as any} />
        </div>

        {error && (
          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-6 border-t border-gray-100 flex justify-end">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full md:w-auto px-10 bg-gradient-to-r from-violet-600 to-violet-700 hover:to-violet-600 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'CREATING...' : <><Send className="w-5 h-5" /> CREATE TASK</>}
        </button>
      </div>
    </div>
  );
}
