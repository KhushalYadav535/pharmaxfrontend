'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CheckSquare, Plus, Loader2, Pencil, Trash2, Calendar, User, PhoneCall, Mail, ListTodo, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import TaskForm from '@/components/operations/TaskForm';
import { useAuth } from '@/lib/auth-context';

export default function TasksPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, statusFilter, priorityFilter],
    queryFn: () => api.get('/tasks', { 
      params: { 
        page, 
        limit: 15,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setProcessing(item.id);
      await api.delete(`/tasks/${item.id}`);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete task');
    } finally {
      setProcessing(null);
    }
  };

  const handleStatusUpdate = async (item: any, newStatus: string) => {
    try {
      setProcessing(item.id + newStatus);
      await api.patch(`/tasks/${item.id}/status`, { status: newStatus });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const tasks = data?.tasks ?? [];

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'CALL': return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case 'EMAIL': return <Mail className="w-4 h-4 text-purple-500" />;
      default: return <ListTodo className="w-4 h-4 text-amber-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'HIGH': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-600 uppercase"><AlertTriangle className="w-3 h-3" /> High</span>;
      case 'MEDIUM': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-600 uppercase">Medium</span>;
      default: return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-600 uppercase">Low</span>;
    }
  };

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <TaskForm
            editData={editData ?? undefined}
            onClose={() => { setShowForm(false); setEditData(null); }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-amber-500" /> Task Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Assign and track daily to-do lists, calls, and follow-ups.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50"
            >
              <option value="">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Priority:</span>
            <select 
              value={priorityFilter} 
              onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Task Details</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status & Progress</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />Loading tasks...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><CheckSquare className="w-10 h-10 mx-auto mb-3 text-gray-200" />No tasks found.</td></tr>
                ) : (
                  tasks.map((t: any) => (
                    <tr key={t.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getTypeIcon(t.type)}</div>
                          <div>
                            <p className="font-bold text-gray-900">{t.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {getPriorityBadge(t.priority)}
                              {t.notes && <span className="text-[10px] text-gray-400 truncate max-w-[150px] inline-block" title={t.notes}>{t.notes}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {t.assignedTo?.firstName?.[0]}{t.assignedTo?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{t.assignedTo?.firstName} {t.assignedTo?.lastName}</p>
                            {t.createdById !== t.assignedToId && (
                              <p className="text-[9px] text-gray-400">By {t.createdBy?.firstName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {t.dueDate ? (
                          <div className="flex items-center gap-1.5 text-gray-600 font-medium text-xs">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(t.dueDate).toLocaleDateString('en-GB')}
                          </div>
                        ) : <span className="text-xs text-gray-400">No date</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {t.status === 'NOT_STARTED' && <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600"><Clock className="w-3 h-3" /> Not Started</span>}
                          {t.status === 'IN_PROGRESS' && <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700"><Loader2 className="w-3 h-3" /> In Progress</span>}
                          {t.status === 'COMPLETED' && <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> Completed</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Quick Status Toggles */}
                          {t.status !== 'COMPLETED' && (
                            <>
                              {t.status === 'NOT_STARTED' && (
                                <button onClick={() => handleStatusUpdate(t, 'IN_PROGRESS')} disabled={processing === t.id + 'IN_PROGRESS'} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200">
                                  {processing === t.id + 'IN_PROGRESS' ? '...' : 'Start'}
                                </button>
                              )}
                              {t.status === 'IN_PROGRESS' && (
                                <button onClick={() => handleStatusUpdate(t, 'COMPLETED')} disabled={processing === t.id + 'COMPLETED'} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200">
                                  {processing === t.id + 'COMPLETED' ? '...' : 'Done'}
                                </button>
                              )}
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                            </>
                          )}

                          <button onClick={() => setEditData(t)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t)} disabled={processing === t.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                            {processing === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
