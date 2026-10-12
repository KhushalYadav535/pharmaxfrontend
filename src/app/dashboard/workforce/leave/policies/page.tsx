'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers, Settings, Plus, RefreshCw, CheckCircle2, AlertCircle,
  ArrowLeft, Edit3, Shield, Check, FileText
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LeavePoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [approvalWorkflow, setApprovalWorkflow] = useState<'DIRECT_MANAGER' | 'TWO_LEVEL'>('DIRECT_MANAGER');
  const [savingSettings, setSavingSettings] = useState(false);

  // Edit / Create Leave Type Modal
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    daysAllowedPerYear: 12,
    carryForwardLimit: 0,
    isPaid: true,
    requiresDocument: false,
    minNoticeDays: 0,
    maxConsecutiveDays: 15,
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, settingsRes] = await Promise.all([
        api.get('/hrms/leave/types'),
        api.get('/hrms/org/settings'),
      ]);
      if (typesRes.data?.success) setLeaveTypes(typesRes.data.data);
      if (settingsRes.data?.success) {
        const leaveWorkflow = settingsRes.data.data.find((s: any) => s.key === 'leave_approval_workflow');
        if (leaveWorkflow) setApprovalWorkflow(leaveWorkflow.value as any);
      }
    } catch (err) {
      console.error('Error fetching leave policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWorkflow = async (workflow: 'DIRECT_MANAGER' | 'TWO_LEVEL') => {
    setSavingSettings(true);
    try {
      await api.put('/hrms/org/settings/leave_approval_workflow', {
        value: workflow,
        description: 'Leave approval hierarchy policy',
      });
      setApprovalWorkflow(workflow);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenEdit = (type: any) => {
    setEditingType(type);
    setForm({
      name: type.name,
      code: type.code,
      daysAllowedPerYear: type.daysAllowedPerYear,
      carryForwardLimit: type.carryForwardLimit,
      isPaid: type.isPaid,
      requiresDocument: type.requiresDocument,
      minNoticeDays: type.minNoticeDays || 0,
      maxConsecutiveDays: type.maxConsecutiveDays || 15,
      description: type.description || '',
    });
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditingType(null);
    setForm({
      name: '',
      code: '',
      daysAllowedPerYear: 12,
      carryForwardLimit: 0,
      isPaid: true,
      requiresDocument: false,
      minNoticeDays: 0,
      maxConsecutiveDays: 15,
      description: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await api.put(`/hrms/leave/types/${editingType.id}`, form);
      } else {
        await api.post('/hrms/leave/types', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving leave type');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/workforce/leave/applications" className="hover:text-slate-800">Leave</Link>
            <span>/</span>
            <span className="text-purple-700 font-medium">Policies & Types</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Policies & Quotas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure company leave categories, annual quotas, carry-forward rules, and approval hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workforce/leave/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Applications Queue
          </Link>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Approval Hierarchy Workflow Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Leave Approval Workflow Policy</h3>
              <p className="text-xs text-slate-500">
                Choose whether field leave applications require Single-Level or Two-Level manager approval.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div
            onClick={() => handleSaveWorkflow('DIRECT_MANAGER')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              approvalWorkflow === 'DIRECT_MANAGER'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">Level 1: Direct Manager Only (Default)</span>
              {approvalWorkflow === 'DIRECT_MANAGER' && <Check className="w-4 h-4 text-white" />}
            </div>
            <p className="text-xs opacity-80">
              Immediate Reporting Manager (ASM / RSM) provides final approval. Leave balance is immediately debited upon manager action.
            </p>
          </div>

          <div
            onClick={() => handleSaveWorkflow('TWO_LEVEL')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              approvalWorkflow === 'TWO_LEVEL'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">Level 2: Manager Review → HR Admin Final</span>
              {approvalWorkflow === 'TWO_LEVEL' && <Check className="w-4 h-4 text-white" />}
            </div>
            <p className="text-xs opacity-80">
              Reporting Manager recommends (Manager Approved), and central HR Admin or Super Admin performs the final confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Leave Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {leaveTypes.map((lt) => (
          <div
            key={lt.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-200 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-100 text-purple-800">
                  {lt.code}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {lt.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{lt.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {lt.description || 'Standard corporate leave quota.'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Annual Entitlement:</span>
                <span className="font-bold text-slate-900">{lt.daysAllowedPerYear} days</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Carry Forward Limit:</span>
                <span className="font-bold text-slate-900">{lt.carryForwardLimit} days</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Requires Medical Proof:</span>
                <span className="font-bold text-slate-900">{lt.requiresDocument ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Max Consecutive:</span>
                <span className="font-bold text-slate-900">{lt.maxConsecutiveDays} days</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleOpenEdit(lt)}
                className="w-full py-2 bg-slate-50 hover:bg-purple-50 text-purple-700 font-semibold rounded-xl text-xs transition-colors border border-slate-100 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Policy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingType ? `Edit ${editingType.name}` : 'New Leave Policy Type'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Casual Leave"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingType}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CL"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Days / Year</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.daysAllowedPerYear}
                    onChange={(e) => setForm({ ...form, daysAllowedPerYear: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carry Forward Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={form.carryForwardLimit}
                    onChange={(e) => setForm({ ...form, carryForwardLimit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">Is Paid Leave</span>
                <input
                  type="checkbox"
                  checked={form.isPaid}
                  onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
                  className="rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">Requires Medical Document</span>
                <input
                  type="checkbox"
                  checked={form.requiresDocument}
                  onChange={(e) => setForm({ ...form, requiresDocument: e.target.checked })}
                  className="rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Policy guidelines..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                Save Policy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
