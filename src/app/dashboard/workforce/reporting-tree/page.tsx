'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users, ChevronRight, ChevronDown, Shield, Building2, MapPin,
  Search, Loader2, Sparkles, UserCheck, Phone, Mail, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface TreeNodeProps {
  node: any;
  search: string;
}

function TreeNode({ node, search }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasReports = node.reports && node.reports.length > 0;

  const matchesSearch = search.trim() !== '' && (
    node.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    node.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    node.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    node.designation?.toLowerCase().includes(search.toLowerCase()) ||
    node.hq?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative pl-6 border-l-2 border-emerald-200/60 ml-3 my-2">
      {/* Node Card */}
      <div className={`p-4 rounded-2xl border transition-all max-w-xl ${
        matchesSearch
          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
          : 'bg-white border-gray-200/80 hover:border-emerald-300 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {node.firstName?.[0]}{node.lastName?.[0]}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm truncate">
                  {node.firstName} {node.lastName}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                  {node.employeeId || 'EMP'}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  node.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                  node.role === 'NSM' ? 'bg-pink-100 text-pink-700' :
                  node.role === 'RSM' ? 'bg-purple-100 text-purple-700' :
                  node.role === 'ASM' ? 'bg-violet-100 text-violet-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {node.role}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                <span>{node.designation || node.role}</span>
                {node.department && <span>• {node.department}</span>}
                {node.hq && (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <MapPin className="w-3 h-3" /> {node.hq.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/masters/employees/${node.id}`}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="View Dossier"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            {hasReports && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <span>{node.reports.length}</span>
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Children list */}
      {hasReports && expanded && (
        <div className="space-y-1 mt-1">
          {node.reports.map((child: any) => (
            <TreeNode key={child.id} node={child} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportingTreePage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['hrms-reporting-tree'],
    queryFn: () => api.get('/hrms/reporting-tree/tree').then(r => r.data.data),
  });

  const roots = data?.roots || [];
  const totalEmployees = data?.totalEmployees || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Reporting Hierarchy
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Reporting Tree</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visual manager-subordinate chain of command from Leadership down to Area Managers and Field Reps.
          </p>
        </div>

        {/* Stats card */}
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Force</div>
            <div className="text-xl font-extrabold text-emerald-600">{totalEmployees}</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Top Roots</div>
            <div className="text-xl font-extrabold text-gray-800">{roots.length}</div>
          </div>
        </div>
      </div>

      {/* Search and filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, code, role, or HQ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-gray-500 hidden sm:block">
          Click on the badge on the right of any manager to expand or collapse their sub-team.
        </div>
      </div>

      {/* Tree Visualization Container */}
      <div className="bg-gray-50/60 rounded-2xl border border-gray-200/90 p-6 shadow-sm overflow-x-auto min-h-[500px]">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Constructing organizational hierarchy tree...</span>
          </div>
        ) : roots.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            No active employees found in the system.
          </div>
        ) : (
          <div className="space-y-4">
            {roots.map((rootNode: any) => (
              <TreeNode key={rootNode.id} node={rootNode} search={search} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
