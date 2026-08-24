'use client';

import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckSquare, Send, AlertCircle, X, Calendar, User, AlignLeft, Flag, Tag } from 'lucide-react';
import { api } from '@/lib/api';

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 bg-white transition-all';
const selectCls = inputCls;

interface TaskFormProps {
  onClose: () => void;
  editData?: any;
}

export default function TaskForm({ onClose, editData }: TaskFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [title, setTitle] = useState(editData?.title ?? '');
  const [type, setType] = useState(editData?.type ?? 'TODO');
  const [priority, setPriority] = useState(editData?.priority ?? 'MEDIUM');
  const [assignedToId, setAssignedToId] = useState(editData?.assignedToId ?? '');
  const [dueDate, setDueDate] = useState(editData?.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : '');
  const [notes, setNotes] = useState(editData?.notes ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Users for Assignment
  const { data: users = [] } = useQuery({ queryKey: ['users-list'], queryFn: () => api.get('/employees', { params: { limit: 500 } }).then(r => r.data.data.employees || []) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { setError('Task title is required'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        title,
        type,
        priority,
        assignedToId: assignedToId || undefined,
        dueDate,
        notes
      };

      if (isEdit) {
        await api.put(`/tasks/${editData.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Task' : 'Create Task'}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form id="taskForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <Field label="Task Title" required span2>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className={inputCls} />
            </Field>

            <Field label="Task Type">
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <select value={type} onChange={e => setType(e.target.value)} className={`${selectCls} pl-10`}>
                  <option value="TODO">To-Do</option>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
            </Field>

            <Field label="Priority">
              <div className="relative">
                <Flag className={`absolute left-3.5 top-3 w-4 h-4 ${priority === 'HIGH' ? 'text-red-500' : priority === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`} />
                <select value={priority} onChange={e => setPriority(e.target.value)} className={`${selectCls} pl-10`}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </Field>

            <Field label="Assign To (Optional)">
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className={`${selectCls} pl-10`}>
                  <option value="">Self (Me)</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>)}
                </select>
              </div>
            </Field>

            <Field label="Due Date">
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${inputCls} pl-10`} />
              </div>
            </Field>

            <Field label="Notes / Description" span2>
              <div className="relative">
                <AlignLeft className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add any extra details here..." className={`${inputCls} pl-10`} />
              </div>
            </Field>

          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="taskForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Task' : 'Save Task'}</>}
        </button>
      </div>
    </div>
  );
}
