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
import AddDoctorModal from '@/components/doctors/AddDoctorModal';
import * as XLSX from 'xlsx';

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
  const [areaId, setAreaId] = useState('');
  const [interiorId, setInteriorId] = useState('');
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
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [importHqId, setImportHqId] = useState(initialHqId);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showHqDeleteConfirmModal, setShowHqDeleteConfirmModal] = useState(false);

  const qc = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: (payload: { doctorIds?: string[]; hqId?: string; deleteAllInHq?: boolean }) =>
      api.post('/doctors/bulk-delete', payload),
    onSuccess: (res: any) => {
      alert(res.data?.message || 'Doctors deleted successfully');
      setSelectedDocIds([]);
      setShowBulkDeleteModal(false);
      setShowHqDeleteConfirmModal(false);
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
      qc.invalidateQueries({ queryKey: ['headquarters'] });
      qc.invalidateQueries({ queryKey: ['doctor-compliance-doctors-page'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Bulk delete failed'),
  });

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
    mutationFn: (payload: { doctors: any[]; hqId?: string }) => api.post('/doctors/bulk', payload),
    onSuccess: (res: any) => {
      setImportResult(res.data?.data);
      setShowImportModal(false);
      setImportPreview([]);
      setImportFile(null);
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
      qc.invalidateQueries({ queryKey: ['headquarters'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Bulk import failed'),
  });

  const downloadSampleDoctorExcel = () => {
    const sampleData = [
      {
        doctorCode: 'DOC-101',
        salutation: 'Dr.',
        firstName: 'Rajesh',
        lastName: 'Sharma',
        specialty: 'CARDIOLOGY',
        qualification: 'MD MBBS',
        classification: 'A',
        category: 'CORE',
        cityArea: 'Central Nagpur',
        interior: 'Umred Road',
        city: 'Nagpur',
        state: 'Maharashtra',
        phone: '9876543210',
        email: 'dr.rajesh@example.com',
        address: 'Dhantoli Medical Center',
      },
      {
        doctorCode: 'DOC-102',
        salutation: 'Dr.',
        firstName: 'Pooja',
        lastName: 'Deshmukh',
        specialty: 'PEDIATRICS',
        qualification: 'DCH MBBS',
        classification: 'A_PLUS',
        category: 'CORE',
        city: 'Nagpur',
        state: 'Maharashtra',
        phone: '9876543211',
        email: 'dr.pooja@example.com',
        address: 'Ramdaspeth Clinic',
      },
      {
        doctorCode: 'DOC-103',
        salutation: 'Dr.',
        firstName: 'Amit',
        lastName: 'Verma',
        specialty: 'GENERAL_PRACTICE',
        qualification: 'MBBS',
        classification: 'B',
        category: 'SECONDARY',
        city: 'Nagpur',
        state: 'Maharashtra',
        phone: '9876543212',
        email: 'dr.amit@example.com',
        address: 'Sitabuldi Square',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors_Template');
    XLSX.writeFile(wb, 'Pharmax_Doctor_Import_Template.xlsx');
  };

  const downloadSampleDoctorCSV = () => {
    const csvSample = `doctorCode,salutation,firstName,lastName,specialty,qualification,classification,category,city,state,phone,email,address
DOC-101,Dr.,Rajesh,Sharma,CARDIOLOGY,MD MBBS,A,CORE,Nagpur,Maharashtra,9876543210,dr.rajesh@example.com,Dhantoli Medical Center
DOC-102,Dr.,Pooja,Deshmukh,PEDIATRICS,DCH MBBS,A_PLUS,CORE,Nagpur,Maharashtra,9876543211,dr.pooja@example.com,Ramdaspeth Clinic
DOC-103,Dr.,Amit,Verma,GENERAL_PRACTICE,MBBS,B,SECONDARY,Nagpur,Maharashtra,9876543212,dr.amit@example.com,Sitabuldi Square`;

    const blob = new Blob([csvSample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Pharmax_Doctor_Import_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsParsingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          alert('Workbook is empty or cannot be read.');
          setIsParsingFile(false);
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw2D: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (!raw2D || raw2D.length === 0) {
          alert('Excel / CSV sheet contains no data rows.');
          setIsParsingFile(false);
          return;
        }

        // Smart Header Row Detection:
        // Many sheets have title banners (e.g. "DOCTOR List for HQ : Nagpur") in row 1 or empty rows.
        // We score each row in the first 10 rows to find the true table header.
        let bestHeaderIdx = 0;
        let maxScore = -1;
        for (let i = 0; i < Math.min(10, raw2D.length); i++) {
          const row = raw2D[i];
          if (!Array.isArray(row)) continue;
          const nonEmptyCells = row.filter((c: any) => String(c || '').trim().length > 0);
          if (nonEmptyCells.length < 2) continue; // Skip single-cell banner rows!

          let score = 0;
          for (const cell of nonEmptyCells) {
            const c = String(cell).toLowerCase().replace(/[\s_-]/g, '');
            if (['doctorname', 'drname', 'name', 'fullname', 'firstname', 'lastname'].includes(c)) score += 5;
            else if (['specialty', 'specialisation', 'designation', 'qualification', 'degree'].includes(c)) score += 4;
            else if (['phone', 'mobile', 'mobileno', 'contact', 'cell', 'mobilenumber'].includes(c)) score += 3;
            else if (['area', 'city', 'address', 'hq', 'headquarter', 'territory'].includes(c)) score += 3;
            else if (['email', 'emailid', 'sn', 'srno', 'code', 'doctorcode', 'category', 'classification'].includes(c)) score += 2;
          }
          if (score > maxScore) {
            maxScore = score;
            bestHeaderIdx = i;
          }
        }

        const headers: string[] = (raw2D[bestHeaderIdx] || []).map((h: any) => String(h || '').trim());

        const getVal = (rowObj: Record<string, string>, ...keys: string[]): string => {
          for (const k of keys) {
            const cleanK = k.toLowerCase().replace(/[\s_-]/g, '');
            for (const rk of Object.keys(rowObj)) {
              if (rk.toLowerCase().replace(/[\s_-]/g, '') === cleanK) {
                const v = rowObj[rk];
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                  return String(v).trim();
                }
              }
            }
          }
          return '';
        };

        const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');

        const parsed: any[] = [];
        for (let rIdx = bestHeaderIdx + 1; rIdx < raw2D.length; rIdx++) {
          const rowCells = raw2D[rIdx];
          if (!rowCells || !rowCells.length) continue;

          const rowObj: Record<string, string> = {};
          headers.forEach((h, colIdx) => {
            if (h) {
              const val = rowCells[colIdx];
              rowObj[h] = val !== undefined && val !== null ? String(val).trim() : '';
            }
          });

          // Extract Doctor Name
          const fullName = getVal(rowObj, 'doctorName', 'doctor_name', 'drName', 'name', 'fullName', 'firstName');
          // If row has no name, or is purely numeric (like empty trailing rows [84]), skip!
          if (!fullName || fullName.length < 2 || /^\d+$/.test(fullName)) {
            continue;
          }

          // Clean up "Dr.", "Dr ", etc.
          let cleanName = fullName.replace(/^Dr\.?\s*/i, '').trim();
          const parts = cleanName.split(/\s+/).filter(Boolean);
          if (parts.length === 0) continue;

          const fName = capitalize(parts[0]);
          const lName = parts.length > 1 ? parts.slice(1).map(capitalize).join(' ') : 'Consultant';

          // Smart specialty mapping from designation / qualification
          const designation = getVal(rowObj, 'designation', 'qualification', 'qual', 'degree');
          const specialtyRaw = getVal(rowObj, 'specialty', 'specialisation', 'specialization');
          let mappedSpecialty = specialtyRaw || 'GENERAL_PRACTICE';
          const desigLower = (designation || specialtyRaw).toLowerCase();
          if (desigLower.includes('dgo') || desigLower.includes('gyn') || desigLower.includes('obs')) {
            mappedSpecialty = 'GYNECOLOGY';
          } else if (desigLower.includes('paed') || desigLower.includes('ped')) {
            mappedSpecialty = 'PEDIATRICS';
          } else if (desigLower.includes('cardio')) {
            mappedSpecialty = 'CARDIOLOGY';
          } else if (desigLower.includes('ortho')) {
            mappedSpecialty = 'ORTHOPEDICS';
          } else if (desigLower.includes('gp') || desigLower.includes('physician')) {
            mappedSpecialty = 'GENERAL_PRACTICE';
          } else if (designation) {
            mappedSpecialty = designation;
          }

          parsed.push({
            doctorCode: getVal(rowObj, 'doctorCode', 'doctor_code', 'docCode', 'code'),
            salutation: 'Dr.',
            firstName: fName,
            lastName: lName,
            specialty: mappedSpecialty,
            qualification: designation || getVal(rowObj, 'qualification', 'qual', 'degree') || 'MBBS',
            classification: getVal(rowObj, 'classification', 'class', 'grade') || 'A',
            category: getVal(rowObj, 'category', 'cat', 'detailingCategory') || 'CORE',
            city: getVal(rowObj, 'area', 'city', 'district') || '',
            state: getVal(rowObj, 'state') || '',
            phone: getVal(rowObj, 'mobileNo', 'mobile_no', 'phone', 'mobile', 'mobileNumber', 'contactNumber', 'cell'),
            email: getVal(rowObj, 'emailId', 'email_id', 'email', 'mail'),
            address: getVal(rowObj, 'address', 'clinicAddress', 'address1'),
            pin: getVal(rowObj, 'pin', 'pincode', 'postalCode'),
            hqCode: getVal(rowObj, 'hqCode', 'headquarterCode', 'hq', 'headquarter'),
          });
        }

        if (parsed.length === 0) {
          alert('Could not find any valid doctor records in sheet. Please verify column headers.');
          setIsParsingFile(false);
          return;
        }

        setImportPreview(parsed);
      } catch (err: any) {
        alert('Failed to read Excel / CSV file: ' + err.message);
      } finally {
        setIsParsingFile(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    const qHq = searchParams?.get('hqId');
    if (qHq) {
      setHqId(qHq);
      setImportHqId(qHq);
      setPage(1);
    }
    if (searchParams?.get('action') === 'new') {
      setShowAddDoctorModal(true);
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

  // Fetch Areas and Interiors for filters
  const { data: areaData } = useQuery({
    queryKey: ['areas-filter-list', hqId],
    queryFn: () => api.get('/areas', { params: { hqId: hqId || undefined, limit: 300 } }).then((r) => r.data.data),
  });
  const areasList = Array.isArray(areaData) ? areaData : areaData?.areas || [];

  const { data: interiorData } = useQuery({
    queryKey: ['interiors-filter-list', hqId],
    queryFn: () => api.get('/interiors', { params: { hqId: hqId || undefined, limit: 300 } }).then((r) => r.data.data),
  });
  const interiorsList = Array.isArray(interiorData) ? interiorData : interiorData?.interiors || [];

  // Fetch Doctors with rich filters
  const { data, isLoading } = useQuery({
    queryKey: ['doctors', { search, specialty, category, hqId, areaId, interiorId, approvalStatus, classification, page }],
    queryFn: () =>
      api
        .get('/doctors', {
          params: {
            search: search || undefined,
            specialty: specialty || undefined,
            category: category || undefined,
            hqId: hqId || undefined,
            areaId: areaId || undefined,
            interiorId: interiorId || undefined,
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

  const hasActiveFilters = search || specialty || category || hqId || areaId || interiorId || classification || approvalStatus !== 'ALL';

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

          <button
            onClick={() => { setShowAddDoctorModal(true); }}
            id="add-doctor-btn"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
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
          <div className="flex items-center gap-3">
            {hqId && isAdmin && (
              <button
                onClick={() => setShowHqDeleteConfirmModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl border border-rose-200 transition-colors"
                title="Bulk delete all doctors assigned to this headquarter"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Doctors in {headquarters.find((h: any) => h.id === hqId)?.name || 'HQ'}</span>
              </button>
            )}
            {hqId && (
              <button
                onClick={() => { setHqId(''); setPage(1); }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Reset to All Headquarters
              </button>
            )}
          </div>
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
              onChange={(e) => { setHqId(e.target.value); setAreaId(''); setInteriorId(''); setPage(1); }}
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

          {/* City Area Filter */}
          <div>
            <select
              value={areaId}
              onChange={(e) => { setAreaId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white text-slate-700"
            >
              <option value="">All City Areas</option>
              {areasList.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interior Filter */}
          <div>
            <select
              value={interiorId}
              onChange={(e) => { setInteriorId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white text-slate-700"
            >
              <option value="">All Interiors</option>
              {interiorsList.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
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
                setAreaId('');
                setInteriorId('');
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
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms, or add a new doctor</p>
                    <button
                      onClick={() => setShowAddDoctorModal(true)}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Doctor
                    </button>
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
                            {doc.firstName?.[0] || 'D'}{doc.lastName?.[0] || (doc.firstName?.[1] || 'R')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              {doc.salutation || 'Dr.'} {doc.firstName || ''} {doc.lastName || ''}
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

                      {/* Headquarter & Territory Mapping */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-800">
                          {doc.hq?.name || doc.territory?.name || 'Unassigned HQ'}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-1 text-[11px]">
                          {doc.area?.name ? (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <span className="font-semibold text-slate-500">City Area:</span> {doc.area.name}
                            </span>
                          ) : null}
                          {doc.interior?.name ? (
                            <span className="inline-flex items-center gap-1 text-violet-700 font-medium">
                              <span className="font-semibold text-violet-500">Interior:</span> {doc.interior.name}
                            </span>
                          ) : null}
                          {!doc.area?.name && !doc.interior?.name ? (
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {doc.city || 'Nagpur'}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Class & Rx Potential */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${CLASSIFICATION_COLORS[doc.classification || 'B'] || 'bg-slate-100 text-slate-700'}`}>
                            {doc.classification ? doc.classification.replace('_', '+') : 'Class B'}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {doc.prescriptionPotential ? (doc.prescriptionPotential > 100 ? `₹${(doc.prescriptionPotential / 1000).toFixed(0)}k` : `${doc.prescriptionPotential}/10`) : '—'}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-xs font-bold">
            <span className="text-emerald-400 font-black">{selectedDocIds.length}</span> Doctors Selected
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer HQ
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete ({selectedDocIds.length})
            </button>
          )}
          <button
            onClick={() => setSelectedDocIds([])}
            className="text-xs font-bold text-slate-400 hover:text-white ml-1"
          >
            Cancel Selection
          </button>
        </div>
      )}

      {/* ──────────────── MODAL: BULK DELETE SELECTED DOCTORS ──────────────── */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bulk Delete {selectedDocIds.length} Doctors?</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected doctors across directory
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Warning
              </p>
              <p>
                Deleting these <strong>{selectedDocIds.length}</strong> doctors will remove them from active MR call lists, tour planning, and territory directory. Historical call logs and compliance records are safely preserved for auditing.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => bulkDeleteMutation.mutate({ doctorIds: selectedDocIds })}
                disabled={bulkDeleteMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete {selectedDocIds.length} Doctors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: BULK DELETE ALL DOCTORS IN ACTIVE HQ ──────────────── */}
      {showHqDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete All Doctors in Headquarter?</h3>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">
                  HQ: {headquarters.find((h: any) => h.id === hqId)?.name || 'Selected HQ'}
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Caution: Complete Headquarter Doctor Wipe
              </p>
              <p>
                Are you sure you want to delete <strong>ALL</strong> doctors currently assigned to{' '}
                <strong>{headquarters.find((h: any) => h.id === hqId)?.name}</strong>?
              </p>
              <p className="text-[11px] text-rose-700">
                Active doctor profiles will be removed from this territory. Past call logs and chemist linkages will be preserved for audits.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowHqDeleteConfirmModal(false)}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => bulkDeleteMutation.mutate({ hqId, deleteAllInHq: true })}
                disabled={bulkDeleteMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete All in {headquarters.find((h: any) => h.id === hqId)?.name}
              </button>
            </div>
          </div>
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

      {/* ──────────────── MODAL: BULK IMPORT DOCTORS (EXCEL & CSV) ──────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Bulk Import Doctors (.xlsx / .csv)</h3>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Template download card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Download Import Templates</span>
                <span className="text-[11px] text-slate-500 block">
                  Columns: doctorCode, firstName, lastName, specialty, phone, qualification, city
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={downloadSampleDoctorExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={downloadSampleDoctorCSV}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  CSV (.csv)
                </button>
              </div>
            </div>

            {/* Target Headquarter Selector */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5">
              <label className="block text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Target Headquarter (HQ) for Imported Doctors
              </label>
              <select
                value={importHqId}
                onChange={(e) => setImportHqId(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
              >
                <option value="">-- Auto-detect from sheet row or default HQ --</option>
                {headquarters.map((hq: any) => (
                  <option key={hq.id} value={hq.id}>
                    {hq.name} ({hq.code}) — {hq.district || hq.state}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-emerald-700 font-medium">
                💡 Doctors without a specific HQ code in the Excel sheet will be linked to this headquarter.
              </p>
            </div>

            {/* File input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Excel (.xlsx, .xls) or CSV (.csv) File
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={isParsingFile}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-2xl p-1 bg-slate-50/50"
              />
              {isParsingFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing Excel workbook...
                </div>
              )}
            </div>

            {/* Smart Deduplication Alert */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="font-bold text-amber-950">Automatic Deduplication Enabled:</strong> If your Excel sheet contains doctors that already exist in the database (matched by Phone, Code, Email, or Name in HQ), <strong>existing doctors will be safely skipped</strong> and only new ones will be added.
              </div>
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Detected in File: {importPreview.length} Doctors</span>
                  {importHqId && (
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Target: {headquarters.find((h: any) => h.id === importHqId)?.name || 'HQ Selected'}
                    </span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/60 text-[11px] divide-y divide-slate-100">
                  {importPreview.slice(0, 10).map((row, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between gap-2 text-slate-700">
                      <div>
                        <strong className="text-slate-900">{row.doctorCode || `DOC-${idx + 1}`}</strong>: {row.salutation} {row.firstName} {row.lastName}
                        <span className="text-slate-400 ml-1">({row.specialty || 'General'})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {row.phone || 'No phone'} · {row.city || 'HQ'}
                      </div>
                    </div>
                  ))}
                  {importPreview.length > 10 && (
                    <div className="text-slate-500 italic pt-1.5 text-center text-[10px]">
                      ... and {importPreview.length - 10} more records in file
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0 || bulkImportMutation.isPending}
                onClick={() => bulkImportMutation.mutate({ doctors: importPreview, hqId: importHqId || undefined })}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5"
              >
                {bulkImportMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Import ({importPreview.length} Doctors)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: DEDUPLICATION & IMPORT RESULT SUMMARY ──────────────── */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Import Completed Successfully</h3>
              </div>
              <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            {/* Summary statistics badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="text-2xl font-black block">{importResult.createdCount ?? 0}</span>
                <span className="text-xs font-bold text-emerald-800">✅ New Doctors Added</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="text-2xl font-black block">{importResult.skippedCount ?? 0}</span>
                <span className="text-xs font-bold text-amber-800">⚠️ Existing Skipped (No Duplicates)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Processed a total of <strong>{importResult.totalRequested ?? 0}</strong> doctor records from your sheet.
              {importResult.skippedCount > 0 ? (
                <span>
                  {' '}The <strong>{importResult.skippedCount}</strong> doctors already existing in the database were <em>not duplicated</em>; only the <strong>{importResult.createdCount}</strong> remaining doctors were added.
                </span>
              ) : (
                <span> All records were newly registered without duplicates.</span>
              )}
            </p>

            {/* Breakdown of skipped doctors */}
            {importResult.skippedDoctors && importResult.skippedDoctors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700">
                  Skipped Doctors ({importResult.skippedDoctors.length}):
                </span>
                <div className="max-h-36 overflow-y-auto border border-amber-200 rounded-xl p-2.5 bg-amber-50/50 text-[11px] space-y-1.5">
                  {importResult.skippedDoctors.map((doc: any, i: number) => (
                    <div key={i} className="flex items-start justify-between border-b border-amber-100 last:border-0 pb-1 text-slate-800">
                      <div>
                        <strong>{doc.name}</strong> {doc.phone ? `(${doc.phone})` : ''}
                      </div>
                      <span className="text-[10px] text-amber-800 font-semibold max-w-[180px] text-right">
                        {doc.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImportResult(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: ADD DOCTOR DIRECTLY ──────────────── */}
      <AddDoctorModal
        isOpen={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        defaultHqId={hqId}
        onDoctorAdded={() => {
          qc.invalidateQueries({ queryKey: ['doctors'] });
          qc.invalidateQueries({ queryKey: ['headquarters-list'] });
        }}
      />

      {/* ──────────────── MODAL: CURATE DOCTOR DETAILING SLIDES ──────────────── */}
      {curatingDoctor && (
        <DoctorDetailingPlanModal
          isOpen={!!curatingDoctor}
          onClose={() => setCuratingDoctor(null)}
          doctor={curatingDoctor}
        />
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
