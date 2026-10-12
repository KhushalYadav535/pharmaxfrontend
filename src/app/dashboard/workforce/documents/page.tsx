'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Search, Plus, Filter, CheckCircle2, Clock,
  AlertTriangle, Shield, Download, Trash2, Check, X,
  Building2, User, Calendar, ExternalLink, RefreshCw, FileCheck,
  UploadCloud, Link2, FileUp, Paperclip
} from 'lucide-react';
import { api, resolveFileUrl } from '@/lib/api';

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'IDENTITY', label: 'Identity Proof (Aadhaar/PAN)' },
  { id: 'ADDRESS', label: 'Address Proof' },
  { id: 'APPOINTMENT_LETTER', label: 'Appointment / Offer' },
  { id: 'EDUCATION', label: 'Educational Degrees' },
  { id: 'DRIVING_LICENSE', label: 'Driving License' },
  { id: 'EXPERIENCE', label: 'Experience & Relieving' },
  { id: 'OTHER', label: 'Other Compliances' },
];

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Upload modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    userId: '',
    category: 'IDENTITY',
    title: '',
    documentNumber: '',
    fileUrl: '',
    fileType: '',
    fileSize: 0,
    issueDate: '',
    expiryDate: '',
    isConfidential: false,
    notes: '',
  });

  const resetModalForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadMode('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm({
      userId: '',
      category: 'IDENTITY',
      title: '',
      documentNumber: '',
      fileUrl: '',
      fileType: '',
      fileSize: 0,
      issueDate: '',
      expiryDate: '',
      isConfidential: false,
      notes: '',
    });
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    const lastDot = file.name.lastIndexOf('.');
    const nameWithoutExt = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
    const cleanTitle = nameWithoutExt.replace(/[_-]+/g, ' ').trim();
    setForm((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : cleanTitle,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([
        api.get('/hrms/documents', {
          params: {
            category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            search: searchQuery || undefined,
          },
        }),
        api.get('/hrms/documents/stats'),
      ]);

      if (docsRes.data?.success) {
        setDocuments(docsRes.data.data);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data?.success) {
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data.data?.employees)
          ? res.data.data.employees
          : [];
        setEmployees(list);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenModal = () => {
    if (employees.length === 0) fetchEmployees();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) {
      alert('Please select an employee.');
      return;
    }
    if (!form.title.trim()) {
      alert('Please provide a document title.');
      return;
    }
    if (uploadMode === 'upload' && !selectedFile && !form.fileUrl) {
      alert('Please choose a file to upload or enter a URL.');
      return;
    }
    if (uploadMode === 'url' && !form.fileUrl.trim()) {
      alert('Please provide a valid file URL.');
      return;
    }

    setSubmitting(true);
    try {
      let finalFileUrl = form.fileUrl;
      let finalFileSize = form.fileSize;
      let finalFileType = form.fileType;

      if (uploadMode === 'upload' && selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const uploadRes = await api.post('/hrms/documents/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          },
        });

        if (uploadRes.data?.success && uploadRes.data?.data?.fileUrl) {
          finalFileUrl = uploadRes.data.data.fileUrl;
          finalFileSize = uploadRes.data.data.fileSize || selectedFile.size;
          finalFileType = uploadRes.data.data.fileType || selectedFile.type;
        } else {
          throw new Error('Failed to upload file to server.');
        }
      }

      const res = await api.post('/hrms/documents', {
        ...form,
        fileUrl: finalFileUrl,
        fileSize: finalFileSize,
        fileType: finalFileType,
      });

      if (res.data?.success) {
        setIsModalOpen(false);
        resetModalForm();
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to register document');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/hrms/documents/${id}/verify`, { status });
      if (res.data?.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document record?')) return;
    try {
      const res = await api.delete(`/hrms/documents/${id}`);
      if (res.data?.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Employee Documents & Compliance Vault</h1>
              <p className="text-sm text-slate-500">
                Centralized dossier repository for Aadhaar, PAN, appointment letters, and licenses
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Documents</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Uploaded across organization</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Dossiers</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats?.verified || 0}</div>
          <div className="text-xs text-emerald-600 mt-1">HR verified & compliant</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Expiring in 30 Days</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats?.expiringSoon || 0}</div>
          <div className="text-xs text-amber-600 mt-1">Renewal notices due</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Expired / Attention</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{stats?.expired || 0}</div>
          <div className="text-xs text-rose-600 mt-1">Requires immediate update</div>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee name, Document title, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Verification</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Document No.</th>
                <th className="py-3 px-4">Validity / Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading employee documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No documents found</p>
                    <p className="text-xs text-slate-400 mt-1">Upload files or adjust the filters above</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                  const isExpiringSoon =
                    doc.expiryDate &&
                    !isExpired &&
                    new Date(doc.expiryDate).getTime() - new Date().getTime() < 30 * 86400000;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div>{doc.title}</div>
                            {doc.isConfidential && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Shield className="w-2.5 h-2.5" /> Confidential
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {doc.user?.firstName} {doc.user?.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {doc.user?.employeeId || 'ID: -'} • {doc.user?.role}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {doc.documentNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.expiryDate ? (
                          <div>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-700'
                                  : isExpiringSoon
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {new Date(doc.expiryDate).toLocaleDateString()}
                            </span>
                            {isExpired && <span className="text-[10px] text-rose-600 block mt-0.5">Expired</span>}
                            {isExpiringSoon && <span className="text-[10px] text-amber-600 block mt-0.5">Expiring Soon</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Lifetime Valid</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {doc.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                          {doc.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {doc.status === 'REJECTED' && <X className="w-3 h-3" />}
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={resolveFileUrl(doc.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded inline-flex items-center gap-1"
                            title="View / Download Document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {doc.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerify(doc.id, 'VERIFIED')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Verify Dossier"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Upload & Register Employee Document</h3>
                <p className="text-xs text-slate-500">Record verification metadata and compliance files</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetModalForm();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">Select Employee...</option>
                  {(Array.isArray(employees) ? employees : []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId || emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCD1234E or AADHAAR"
                    value={form.documentNumber}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pan Card Original / B.Pharm Degree"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    File Attachment <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setUploadMode('upload')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                        uploadMode === 'upload'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                        uploadMode === 'url'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Direct URL
                    </button>
                  </div>
                </div>

                {uploadMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />

                    {!selectedFile ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileChange(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                          isDragging
                            ? 'border-emerald-500 bg-emerald-50/60'
                            : 'border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          Click to select a file <span className="font-normal text-slate-500">or drag and drop</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PDF, Word, Excel, JPG, PNG up to 25MB
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate" title={selectedFile.name}>
                                {selectedFile.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2 py-1 text-[11px] text-emerald-600 hover:bg-emerald-50 rounded font-medium"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 text-right mt-0.5">Uploading: {uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required={uploadMode === 'url'}
                      placeholder="e.g. /uploads/documents/pan_card.pdf or https://..."
                      value={form.fileUrl}
                      onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct cloud storage link, S3 key, or intranet URL.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={form.isConfidential}
                  onChange={(e) => setForm({ ...form, isConfidential: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="confidential" className="text-xs text-slate-700">
                  Mark as confidential (visible only to HR and Management)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetModalForm();
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
