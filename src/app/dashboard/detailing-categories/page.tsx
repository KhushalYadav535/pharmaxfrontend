'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  Package,
  Users,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  Tag,
  Palette,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import DoctorDetailingPlanModal, {
  DoctorDetailingPlan
} from '@/components/operations/DoctorDetailingPlanModal';
import {
  DetailingCategory,
  DEFAULT_CATEGORIES,
  normalizeDoctorSpecialty,
  isProductInSpecialty
} from '@/lib/product-specialty-mapping';

type TabKey = 'categories' | 'doctors';

const COLOR_PRESETS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#d97706', // Amber
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];

export default function DetailingCategoriesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('categories');
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#059669');
  const [formKeywords, setFormKeywords] = useState('');
  const [formProductNames, setFormProductNames] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Doctor tab filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [reassigningDoctor, setReassigningDoctor] = useState<any | null>(null);
  const [targetCategory, setTargetCategory] = useState('');

  // Doctor Slide Deck Modal state
  const [curatingDoctor, setCuratingDoctor] = useState<any | null>(null);

  // Batch Doctor Assignment modal state
  const [assignModalCategory, setAssignModalCategory] = useState<any | null>(null);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [assignDoctorSearch, setAssignDoctorSearch] = useState('');
  const [doctorAssignmentFilter, setDoctorAssignmentFilter] = useState<'all' | 'selected'>('all');
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Queries
  const { data: categories = DEFAULT_CATEGORIES, isLoading: catLoading } = useQuery({
    queryKey: ['detailing-categories-list'],
    queryFn: () =>
      api
        .get('/content/categories')
        .then((r) => (Array.isArray(r.data.data) && r.data.data.length > 0 ? r.data.data : DEFAULT_CATEGORIES))
        .catch(() => DEFAULT_CATEGORIES),
  });

  const { data: allContents = [] } = useQuery({
    queryKey: ['contents'],
    queryFn: () => api.get('/content').then((r) => r.data.data || []),
  });

  const { data: productsData } = useQuery({
    queryKey: ['all-products-for-categories'],
    queryFn: () => api.get('/products', { params: { limit: 200 } }).then((r) => r.data.data),
  });
  const allProducts = Array.isArray(productsData) ? productsData : productsData?.products || [];

  const { data: doctorsData, isLoading: docLoading } = useQuery({
    queryKey: ['doctors-category-view', selectedCategoryFilter, doctorSearch],
    queryFn: () =>
      api
        .get('/doctors', {
          params: {
            category: selectedCategoryFilter || undefined,
            search: doctorSearch || undefined,
            limit: 200,
          },
        })
        .then((r) => r.data.data),
    enabled: activeTab === 'doctors' || !!assignModalCategory,
  });
  const doctorList = doctorsData?.doctors || [];

  // All doctors for assignment modal
  const { data: allDoctorsData } = useQuery({
    queryKey: ['all-doctors-for-assignment'],
    queryFn: () =>
      api.get('/doctors', { params: { limit: 500 } }).then((r) => r.data.data?.doctors || []),
    enabled: !!assignModalCategory,
  });
  const allDoctors = allDoctorsData || [];

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (newCat: any) => api.post('/content/categories', newCat),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['detailing-categories-list'] });
      qc.invalidateQueries({ queryKey: ['detailing-categories'] });
      setIsNewCategoryModalOpen(false);
      resetForm();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/content/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['detailing-categories-list'] });
      qc.invalidateQueries({ queryKey: ['detailing-categories'] });
      setEditingCategory(null);
      resetForm();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['detailing-categories-list'] });
      qc.invalidateQueries({ queryKey: ['detailing-categories'] });
      setDeletingId(null);
    },
  });

  const updateDoctorCategoryMutation = useMutation({
    mutationFn: ({ doctorId, category }: { doctorId: string; category: string }) =>
      api.put(`/doctors/${doctorId}`, { category, specialty: category }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors-category-view'] });
      qc.invalidateQueries({ queryKey: ['doctors'] });
      setReassigningDoctor(null);
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormColor('#059669');
    setFormKeywords('');
    setFormProductNames([]);
    setProductSearch('');
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormCode(cat.code || '');
    setFormDescription(cat.description || '');
    setFormColor(cat.color || '#059669');
    setFormKeywords(Array.isArray(cat.doctorKeywords) ? cat.doctorKeywords.join(', ') : '');
    setFormProductNames(Array.isArray(cat.productNames) ? cat.productNames : []);
    setProductSearch('');
  };

  // Open Batch Doctor Assignment Modal
  const openAssignModal = (cat: any) => {
    setAssignModalCategory(cat);
    setAssignDoctorSearch('');
    setDoctorAssignmentFilter('all');
    // Pre-select doctors whose category/specialty matches this category
    const catCode = (cat.code || cat.name).toUpperCase();
    const assignedIds = allDoctors
      .filter(
        (d: any) =>
          normalizeDoctorSpecialty(d.specialty, d.category, categories) === catCode ||
          (d.category && d.category.toUpperCase() === catCode) ||
          (d.specialty && d.specialty.toUpperCase() === catCode)
      )
      .map((d: any) => d.id);
    setSelectedDoctorIds(assignedIds);
  };

  const toggleDoctorSelection = (docId: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // Save Batch Doctor Assignments
  const handleSaveDoctorAssignments = async () => {
    if (!assignModalCategory) return;
    setIsSavingAssignments(true);
    try {
      const catCode = (assignModalCategory.code || assignModalCategory.name).toUpperCase();
      const currentCategoryDocs = allDoctors.filter(
        (d: any) =>
          normalizeDoctorSpecialty(d.specialty, d.category, categories) === catCode ||
          (d.category && d.category.toUpperCase() === catCode)
      );
      const currentCategoryDocIds = new Set<string>(currentCategoryDocs.map((d: any) => String(d.id)));
      const newlySelected = selectedDoctorIds.filter((id) => !currentCategoryDocIds.has(id));
      const unselected = Array.from(currentCategoryDocIds).filter((id) => !selectedDoctorIds.includes(id));

      // Update newly selected doctors
      await Promise.all(
        newlySelected.map((id) =>
          api.put(`/doctors/${id}`, {
            specialty: assignModalCategory.name,
            category: assignModalCategory.code || assignModalCategory.name,
          })
        )
      );

      // Revert unselected doctors back to General
      await Promise.all(
        unselected.map((id) =>
          api.put(`/doctors/${id}`, {
            category: 'GENERAL',
          })
        )
      );

      await qc.invalidateQueries({ queryKey: ['doctors-category-view'] });
      await qc.invalidateQueries({ queryKey: ['all-doctors-for-assignment'] });
      await qc.invalidateQueries({ queryKey: ['doctors'] });
      setAssignModalCategory(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update doctor assignments.');
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const handleSave = () => {
    const keywords = formKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      name: formName.trim(),
      code: formCode.trim() || undefined,
      description: formDescription.trim() || undefined,
      color: formColor,
      doctorKeywords: keywords,
      productNames: formProductNames,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id || editingCategory.code, data: payload });
    } else {
      createCategoryMutation.mutate(payload);
    }
  };

  const toggleProduct = (prodName: string) => {
    setFormProductNames((prev) =>
      prev.includes(prodName) ? prev.filter((p) => p !== prodName) : [...prev, prodName]
    );
  };

  const filteredCategories = (categories || []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const codeMatch = c.code?.toLowerCase().includes(q);
    const prodMatch = Array.isArray(c.productNames) && c.productNames.some((p: string) => p.toLowerCase().includes(q));
    return nameMatch || codeMatch || prodMatch;
  });

  // Modal filtered doctors for Batch Assignment
  const modalFilteredDoctors = useMemo(() => {
    let list = allDoctors;
    if (doctorAssignmentFilter === 'selected') {
      list = list.filter((d: any) => selectedDoctorIds.includes(d.id));
    }
    if (assignDoctorSearch.trim()) {
      const q = assignDoctorSearch.toLowerCase();
      list = list.filter((d: any) => {
        const name = `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase();
        const code = (d.doctorCode || '').toLowerCase();
        const spec = (d.specialty || '').toLowerCase();
        const hosp = (d.hospital?.name || '').toLowerCase();
        const city = (d.city || '').toLowerCase();
        return name.includes(q) || code.includes(q) || spec.includes(q) || hosp.includes(q) || city.includes(q);
      });
    }
    return list;
  }, [allDoctors, assignDoctorSearch, doctorAssignmentFilter, selectedDoctorIds]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Biocros Detailing Master Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Detailing & Doctor Categories Master
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
            Define doctor specialties, map Biocros medicines, curate detailing slide sets, and batch-assign field doctors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/digital-detailing"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs sm:text-sm border border-white/20"
          >
            <Layers className="w-4 h-4 text-emerald-300" /> Digital Detailing Deck
          </Link>
          <button
            onClick={() => {
              resetForm();
              setIsNewCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" /> Create Category
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Detailing Categories ({categories?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'doctors'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Doctor Detailing & Specialties
        </button>
      </div>

      {/* ──────────────── TAB 1: CATEGORIES ──────────────── */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category or medicine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            />
          </div>

          {catLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="font-semibold text-slate-700">No detailing categories found</p>
              <button
                onClick={() => {
                  resetForm();
                  setIsNewCategoryModalOpen(true);
                }}
                className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
              >
                + Create your first Detailing Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat: any) => {
                const productCount = Array.isArray(cat.productNames) ? cat.productNames.length : 0;
                const keywords = Array.isArray(cat.doctorKeywords) ? cat.doctorKeywords : [];

                // Count matching slides in content catalog
                const matchingSlidesCount = allContents.filter((c: any) => {
                  const pName = c.productName || c.title || '';
                  return isProductInSpecialty(pName, cat.code || cat.name, categories);
                }).length;

                return (
                  <div
                    key={cat.id || cat.code}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 hover:border-emerald-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color || '#059669' }}
                          />
                          <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {cat.code || 'CAT'}
                        </span>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{cat.description}</p>
                      )}

                      {/* Stats Badges */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                          {productCount} Medicines
                        </span>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                          {matchingSlidesCount} Detailing Slides
                        </span>
                      </div>

                      {/* Doctor Keywords */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                          Doctor Keywords
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {keywords.slice(0, 4).map((kw: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100"
                            >
                              {kw}
                            </span>
                          ))}
                          {keywords.length > 4 && (
                            <span className="text-[11px] text-slate-400 font-semibold self-center">
                              +{keywords.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mapped Biocros Products */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                          Mapped Medicines
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(cat.productNames || []).slice(0, 4).map((prod: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                            >
                              {prod}
                            </span>
                          ))}
                          {productCount > 4 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{productCount - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Assign Doctors Button */}
                        <button
                          onClick={() => openAssignModal(cat)}
                          className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
                          title="Assign Doctors to this Category"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Assign Doctors
                        </button>

                        {/* View in Digital Detailing */}
                        <Link
                          href={`/dashboard/digital-detailing?activeCategory=${cat.code || cat.name}`}
                          className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-xl border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" /> Slides
                        </Link>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Category & Medicines"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(cat.id || cat.code)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: DOCTOR SPECIALTY MAPPING ──────────────── */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">All Categories ({categories?.length || 0})</option>
                {(categories || []).map((cat: any) => (
                  <option key={cat.id || cat.code} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctor or code..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium self-start sm:self-center">
              Total Doctors: <strong className="text-slate-800">{doctorList.length}</strong>
            </div>
          </div>

          {/* Doctor Mapping List */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600">
                    <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Doctor Code</th>
                    <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Doctor Name</th>
                    <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Assigned Category</th>
                    <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Specialty</th>
                    <th className="text-left px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Headquarter</th>
                    <th className="text-right px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Detailing Slide Set & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-slate-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : doctorList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        No doctors found for this category
                      </td>
                    </tr>
                  ) : (
                    doctorList.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {doc.doctorCode || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900">
                            Dr. {doc.firstName} {doc.lastName}
                          </span>
                          {doc.qualification && (
                            <span className="text-[11px] text-slate-400 block">{doc.qualification}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 text-xs">
                            {doc.category || doc.specialty || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 text-xs">{doc.specialty || '—'}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 text-xs">
                          {doc.hq?.name || doc.territory?.name || 'Nagpur'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Curate Slide Set */}
                            <button
                              onClick={() => setCuratingDoctor(doc)}
                              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-colors border border-purple-200 flex items-center gap-1 shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Curate Slide Set
                            </button>

                            {/* Reassign Category */}
                            <button
                              onClick={() => {
                                setReassigningDoctor(doc);
                                setTargetCategory(doc.category || doc.specialty || '');
                              }}
                              className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors border border-slate-200"
                            >
                              Category
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
      )}

      {/* ──────────────── MODAL 1: CREATE / EDIT CATEGORY ──────────────── */}
      {(isNewCategoryModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingCategory ? `Edit Detailing Category: ${editingCategory.name}` : 'Create New Detailing Category'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure name, keywords, and mapped Biocros medicines</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewCategoryModalOpen(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Consultant Gynecologist, Pediatrician"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. GYNE, PEDI, ORTHO"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Target doctor profiles, indication, and clinical specialty"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                />
              </div>

              {/* Doctor Keywords */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Doctor Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. gynecologist, obgyn, obstetrician, women health"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                />
              </div>

              {/* Color Preset */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Mapped Biocros Products Multi-Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Map Biocros Medicines ({formProductNames.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Featured when detailing to doctors of this category
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search medicine name to map..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 bg-slate-50/40">
                  {allProducts
                    .filter((p: any) =>
                      productSearch ? p.name?.toLowerCase().includes(productSearch.toLowerCase()) : true
                    )
                    .map((p: any) => {
                      const isChecked = formProductNames.includes(p.name);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProduct(p.name)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-emerald-50/80 text-emerald-900 font-semibold' : 'hover:bg-slate-100/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-xs">{p.name}</span>
                          </div>
                          {p.category && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {p.category}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setIsNewCategoryModalOpen(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !formName.trim() ||
                  createCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
                }
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 2: BATCH ASSIGN DOCTORS TO CATEGORY ──────────────── */}
      {assignModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Assign Doctors to {assignModalCategory.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select doctors who belong to this medical specialty ({selectedDoctorIds.length} assigned)
                </p>
              </div>
              <button onClick={() => setAssignModalCategory(null)} className="p-1.5 rounded-xl hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={assignDoctorSearch}
                    onChange={(e) => setAssignDoctorSearch(e.target.value)}
                    placeholder="Search doctor by name, specialty, clinic, or city..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setDoctorAssignmentFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      doctorAssignmentFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    All Doctors ({allDoctors.length})
                  </button>
                  <button
                    onClick={() => setDoctorAssignmentFilter('selected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      doctorAssignmentFilter === 'selected'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Assigned ({selectedDoctorIds.length})
                  </button>
                </div>
              </div>

              {/* Doctors Multi-select list */}
              <div className="border border-slate-200 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
                {modalFilteredDoctors.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No doctors match current search
                  </div>
                ) : (
                  modalFilteredDoctors.map((doc: any) => {
                    const isChecked = selectedDoctorIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleDoctorSelection(doc.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-emerald-50/80' : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Dr. {doc.firstName} {doc.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {doc.specialty || 'General'} • {doc.hospital?.name || doc.city || 'Nagpur'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {doc.doctorCode || 'DOC'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                <strong>{selectedDoctorIds.length}</strong> doctors assigned to {assignModalCategory.name}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAssignModalCategory(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDoctorAssignments}
                  disabled={isSavingAssignments}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSavingAssignments ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Assignments...
                    </>
                  ) : (
                    'Save Doctor Assignments'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 3: DELETE CONFIRMATION ──────────────── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Category?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This detailing category will be deactivated from the detailing catalog.
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-6">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCategoryMutation.mutate(deletingId)}
                disabled={deleteCategoryMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 4: REASSIGN DOCTOR CATEGORY ──────────────── */}
      {reassigningDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Reassign Doctor Category
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Dr. {reassigningDoctor.firstName} {reassigningDoctor.lastName} ({reassigningDoctor.doctorCode})
              </p>

              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Choose Target Category
              </label>

              <div className="space-y-1.5 max-h-60 overflow-y-auto mb-5">
                {(categories || []).map((cat: any) => {
                  const isSelected = targetCategory === cat.name;
                  return (
                    <button
                      key={cat.id || cat.code}
                      onClick={() => setTargetCategory(cat.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setReassigningDoctor(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateDoctorCategoryMutation.mutate({
                      doctorId: reassigningDoctor.id,
                      category: targetCategory,
                    })
                  }
                  disabled={!targetCategory || updateDoctorCategoryMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 5: CURATE DOCTOR SLIDE DECK & PLAN ──────────────── */}
      {curatingDoctor && (
        <DoctorDetailingPlanModal
          isOpen={!!curatingDoctor}
          onClose={() => setCuratingDoctor(null)}
          doctor={curatingDoctor}
          allContents={allContents}
          categories={categories}
        />
      )}
    </div>
  );
}
