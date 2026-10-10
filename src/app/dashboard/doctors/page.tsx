'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, CLASSIFICATION_COLORS } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Building2,
  Star,
  Loader2,
  X,
  Download,
  Upload,
  ArrowLeftRight,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  MapPin,
  Tag,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import DoctorDetailingPlanModal from '@/components/operations/DoctorDetailingPlanModal';

const CLASSIFICATIONS = ['A_PLUS', 'A', 'B', 'C'];
const APPROVAL_STATUSES = [
  { value: 'ALL', label: 'All Status' },
  { value: 'APPROVED', label: 'Approved Only' },
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'REJECTED', label: 'Rejected' },
];

function DoctorsPageContent() {
  const searchParams = useSearchParams();
  const initialHqId = searchParams?.get('hqId') || '';
  const { user } = useAuth();
  const isAdmin = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'].includes(user?.role || '');

  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [category, setCategory] = useState('');
  const [hqId, setHqId] = useState(initialHqId);
  const [approvalStatus, setApprovalStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [classification, setClassification] = useState('');
  const [page, setPage] = useState(1);
  const [curatingDoctor, setCuratingDoctor] = useState<any | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<any | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTransferHqId, setTargetTransferHqId] = useState('');
  const [zeroCallOnly, setZeroCallOnly] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const qc = useQueryClient();

  // Fetch compliance data for zero-call doctors
  const { data: complianceData } = useQuery({
    queryKey: ['doctor-compliance-doctors-page'],
    queryFn: () => api.get('/analytics/doctor-frequency-compliance').then((r) => r.data.data),
  });

  const transferMutation = useMutation({
    mutationFn: (body: { doctorIds: string[]; hqId: string }) => api.post('/doctors/bulk-transfer', body),
    onSuccess: (res: any) => {
      alert(res.data?.message || 'Doctors successfully transferred');
      setSelectedDocIds([]);
      setShowTransferModal(false);
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Transfer failed'),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (doctors: any[]) => api.post('/doctors/bulk', { doctors }),
    onSuccess: (res: any) => {
      alert(res.data?.message || 'Doctors successfully imported');
      setShowImportModal(false);
      setImportPreview([]);
      setImportFile(null);
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Bulk import failed'),
  });

  const downloadSampleDoctorCSV = () => {
    const csvSample = `doctorCode,firstName,lastName,specialty,qualification,classification,category,city,state,phone,email
DOC-101,Rajesh,Sharma,CARDIOLOGY,MD MBBS,A,CORE,Nagpur,Maharashtra,9876543210,dr.rajesh@example.com
DOC-102,Pooja,Deshmukh,PEDIATRICS,DCH MBBS,A_PLUS,CORE,Nagpur,Maharashtra,9876543211,dr.pooja@example.com
DOC-103,Amit,Verma,GENERAL_PRACTICE,MBBS,B,SECONDARY,Nagpur,Maharashtra,9876543212,dr.amit@example.com`;

    const blob = new Blob([csvSample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Pharmax_Doctor_Import_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least 1 doctor record.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const parsed = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      });
      setImportPreview(parsed);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const qHq = searchParams?.get('hqId');
    if (qHq) {
      setHqId(qHq);
      setPage(1);
    }
  }, [searchParams]);

  // Fetch Headquarters for dropdown
  const { data: hqData } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters').then((r) => r.data.data),
  });
  const headquarters = Array.isArray(hqData) ? hqData : hqData?.headquarters || [];

  // Fetch Detailing Categories for filter
  const { data: catData } = useQuery({
    queryKey: ['detailing-categories-list'],
    queryFn: () => api.get('/content/categories').then((r) => r.data.data),
  });
  const categoriesList = Array.isArray(catData) ? catData : [];

  // Fetch Doctors with rich filters
  const { data, isLoading } = useQuery({
    queryKey: ['doctors', { search, specialty, category, hqId, approvalStatus, classification, page }],
    queryFn: () =>
      api
        .get('/doctors', {
          params: {
            search: search || undefined,
            specialty: specialty || undefined,
            category: category || undefined,
            hqId: hqId || undefined,
            approvalStatus: approvalStatus || undefined,
            classification: classification || undefined,
            page,
            limit: 20,
          },
        })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  // Quick Approve/Reject mutations for pending doctors
  const updateEntityMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.post(`/approvals/entities/Doctor/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['approvals-summary'] });
    },
  });

  // Delete doctor mutation (Admin only)
  const deleteDoctorMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/doctors/${docId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
      setDoctorToDelete(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete doctor');
    },
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (!data?.doctors || data.doctors.length === 0) return;
    const headers = ['Doctor Code', 'Name', 'Qualification', 'Category', 'Specialty', 'Headquarter', 'City', 'Phone', 'Class', 'Rx Potential', 'Approval Status'];
    const rows = data.doctors.map((d: any) => [
      d.doctorCode || 'N/A',
      `"Dr. ${d.firstName} ${d.lastName}"`,
      `"${d.qualification || ''}"`,
      `"${d.category || ''}"`,
      `"${d.specialty || ''}"`,
      `"${d.hq?.name || d.territory?.name || ''}"`,
      `"${d.city || ''}"`,
      `"${d.phone || ''}"`,
      d.classification || 'B',
      d.prescriptionPotential || 0,
      d.approvalStatus || 'APPROVED',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pharmax_Doctors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = search || specialty || category || hqId || classification || approvalStatus !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-600" /> Doctor CRM & Directory
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Biocros Healthcare
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Manage all master doctors, headquarters, specialty categories, and verification status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/detailing-categories"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Detailing Master
          </Link>

          <button
            onClick={handleExportCSV}
            disabled={!data?.doctors?.length}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200 shadow-sm"
          >
            <Upload className="w-4 h-4 text-emerald-600" /> Import Excel / CSV
          </button>

          <Link
            href="/dashboard/doctors/new"
            id="add-doctor-btn"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </Link>
        </div>
      </div>

      {/* Stats / Classification & Zero-Call Compliance Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CLASSIFICATIONS.map((cls) => {
          const isSelected = classification === cls && !zeroCallOnly;
          return (
            <button
              key={cls}
              onClick={() => { setClassification(isSelected ? '' : cls); setZeroCallOnly(false); setPage(1); }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${CLASSIFICATION_COLORS[cls]}`}>
                  Class {cls.replace('_', '+')}
                </span>
                <span className="text-xs text-slate-400 font-medium">Filter</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {cls === 'A_PLUS' ? 'Ultra High Rx Potential' : cls === 'A' ? 'High Potential' : cls === 'B' ? 'Moderate Potential' : 'Standard Potential'}
              </p>
            </button>
          );
        })}

        {/* 5th Pill: Zero-Call Doctors (0 Calls This Month) */}
        <button
          onClick={() => { setZeroCallOnly(!zeroCallOnly); setClassification(''); setPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            zeroCallOnly
              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-200/80 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
              Zero-Call ({complianceData?.zeroCallCount ?? 0})
            </span>
            <span className="text-xs text-rose-500 font-bold">Alert</span>
          </div>
          <p className="text-xs text-rose-600 mt-2 font-medium">
            Missed Calls This Month
          </p>
        </button>
      </div>

      {/* ── Headquarter-Wise Quick Filter Pill Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Territory / Headquarter Doctor Filter:</span>
          </div>
          {hqId && (
            <button
              onClick={() => { setHqId(''); setPage(1); }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Reset to All Headquarters
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5">
          <button
            onClick={() => { setHqId(''); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              !hqId ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Headquarters ({data?.total || 0})
          </button>
          {headquarters.map((hq: any) => {
            const isSelected = hqId === hq.id;
            const count = hq._count?.doctors ?? 0;
            return (
              <button
                key={hq.id}
                onClick={() => { setHqId(isSelected ? '' : hq.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 opacity-70" />
                <span>{hq.name}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  isSelected ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {count} Doctors
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Filter Desk */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by code (DOC-NAGP-*), name, or specialty..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Headquarter Filter */}
          <div>
            <select
              value={hqId}
              onChange={(e) => { setHqId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white text-slate-700"
            >
              <option value="">All Headquarters</option>
              {headquarters.map((hq: any) => (
                <option key={hq.id} value={hq.id}>
                  {hq.name} {hq.code ? `(${hq.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Detailing Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat: any) => (
                <option key={cat.id || cat.key} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Approval Status */}
          <div>
            <select
              value={approvalStatus}
              onChange={(e) => { setApprovalStatus(e.target.value as any); setPage(1); }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white text-slate-700 font-medium"
            >
              {APPROVAL_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing filtered results ({data?.total || 0} matching doctor{data?.total !== 1 ? 's' : ''})
            </span>
            <button
              onClick={() => {
                setSearch('');
                setSpecialty('');
                setCategory('');
                setHqId('');
                setApprovalStatus('ALL');
                setClassification('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Doctor Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedDocIds.length > 0 &&
                      selectedDocIds.length === (data?.doctors?.length || 0)
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocIds((data?.doctors || []).map((d: any) => d.id));
                      } else {
                        setSelectedDocIds([]);
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Doctor Code</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Doctor & Qual</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Headquarter / City</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Class & Rx</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Approval Status</th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 2 ? '160px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (zeroCallOnly ? (data?.doctors || []).filter((d: any) => complianceData?.zeroCallDoctors?.some((z: any) => z.id === d.id)) : (data?.doctors || [])).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-600">No doctors match current filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms</p>
                  </td>
                </tr>
              ) : (
                (zeroCallOnly ? (data?.doctors || []).filter((d: any) => complianceData?.zeroCallDoctors?.some((z: any) => z.id === d.id)) : (data?.doctors || [])).map((doc: any) => {
                  const isPending = doc.approvalStatus === 'PENDING';
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <tr key={doc.id} className={`hover:bg-slate-50/70 transition-colors group ${isChecked ? 'bg-emerald-50/30' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 w-8">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds((prev) => [...prev, doc.id]);
                            } else {
                              setSelectedDocIds((prev) => prev.filter((id) => id !== doc.id));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>

                      {/* Doctor Code */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {doc.doctorCode || '—'}
                        </span>
                      </td>

                      {/* Doctor Name & Qualification */}
                      <td className="px-4 py-3.5">
                        <Link href={`/dashboard/doctors/${doc.id}`} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {doc.firstName?.[0] || 'D'}{doc.lastName?.[0] || 'R'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              {doc.salutation || 'Dr.'} {doc.firstName} {doc.lastName}
                              {doc.isKol && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> KOL
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {doc.qualification || doc.specialty || 'General Practitioner'}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Detailing Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          {doc.category || doc.specialty || 'General'}
                        </span>
                      </td>

                      {/* Headquarter & City */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-800">
                          {doc.hq?.name || doc.territory?.name || 'Unassigned HQ'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {doc.city || doc.area?.name || 'Nagpur'}
                        </p>
                      </td>

                      {/* Class & Rx Potential */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${CLASSIFICATION_COLORS[doc.classification]}`}>
                            {doc.classification.replace('_', '+')}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {doc.prescriptionPotential}/10
                          </span>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            doc.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : doc.approvalStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {doc.approvalStatus === 'APPROVED' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                          )}
                          {doc.approvalStatus || 'APPROVED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => updateEntityMutation.mutate({ id: doc.id, status: 'REJECTED' })}
                                disabled={updateEntityMutation.isPending}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Reject Doctor"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateEntityMutation.mutate({ id: doc.id, status: 'APPROVED' })}
                                disabled={updateEntityMutation.isPending}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve Doctor"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setCuratingDoctor(doc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg transition-colors border border-purple-200"
                            title="Curate Detailing Slide Set"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Slides
                          </button>
                          <Link
                            href={`/dashboard/doctors/${doc.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => setDoctorToDelete(doc)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="Delete Doctor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="border-t border-slate-100 px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm bg-slate-50/50">
            <p className="text-slate-500 font-medium">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total} doctors
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {curatingDoctor && (
        <DoctorDetailingPlanModal
          isOpen={!!curatingDoctor}
          onClose={() => setCuratingDoctor(null)}
          doctor={curatingDoctor}
        />
      )}

      {/* ──────────────── MODAL: CONFIRM DELETE DOCTOR ──────────────── */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Doctor Profile?</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Dr. {doctorToDelete.firstName} {doctorToDelete.lastName} ({doctorToDelete.doctorCode || 'Doctor'})
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Warning
              </p>
              <p>
                Deleting this doctor will remove them from active field lists, MR tour plans, and doctor directories. Existing past visits and order records will be preserved for audit history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                disabled={deleteDoctorMutation.isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteDoctorMutation.mutate(doctorToDelete.id)}
                disabled={deleteDoctorMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {deleteDoctorMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────── FLOATING BULK ACTIONS BAR ──────────────── */}
      {selectedDocIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-xs font-bold">
            <span className="text-emerald-400 font-black">{selectedDocIds.length}</span> Doctors Selected
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer to Territory / HQ
          </button>
          <button
            onClick={() => setSelectedDocIds([])}
            className="text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancel Selection
          </button>
        </div>
      )}

      {/* ──────────────── MODAL: BULK TRANSFER DOCTORS ──────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Reassign / Transfer Doctors</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Transferring <strong>{selectedDocIds.length}</strong> selected doctors to a new territory or headquarter base.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Headquarter</label>
              <select
                value={targetTransferHqId}
                onChange={(e) => setTargetTransferHqId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-slate-800"
              >
                <option value="">Select Target Headquarter</option>
                {headquarters.map((hq: any) => (
                  <option key={hq.id} value={hq.id}>
                    {hq.name} {hq.code ? `(${hq.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={!targetTransferHqId || transferMutation.isPending}
                onClick={() => transferMutation.mutate({ doctorIds: selectedDocIds, hqId: targetTransferHqId })}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5"
              >
                {transferMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: BULK IMPORT DOCTORS ──────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Bulk Import Doctors (Excel / CSV)</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                Cancel
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Download Excel / CSV Template</span>
                <span className="text-[11px] text-slate-500 block">Contains required columns: doctorCode, firstName, lastName, specialty, city, phone</span>
              </div>
              <button
                onClick={downloadSampleDoctorCSV}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs flex-shrink-0"
              >
                Download Sample
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Select .CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            {importPreview.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">Preview ({importPreview.length} Doctors detected):</span>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 text-[11px]">
                  {importPreview.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="py-1 border-b border-slate-100 last:border-0 text-slate-700 font-mono">
                      <strong>{row.doctorCode || `DOC-${idx + 1}`}</strong>: Dr. {row.firstName} {row.lastName} ({row.specialty || 'General'}) · {row.city || 'Nagpur'}
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="text-slate-400 italic pt-1">... and {importPreview.length - 5} more records</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0 || bulkImportMutation.isPending}
                onClick={() => bulkImportMutation.mutate(importPreview)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-1.5"
              >
                {bulkImportMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Import ({importPreview.length} Doctors)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-bold">Loading Doctor Directory & Territories...</p>
        </div>
      }
    >
      <DoctorsPageContent />
    </Suspense>
  );
}
