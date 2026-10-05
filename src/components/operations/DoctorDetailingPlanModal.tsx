'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Check,
  Search,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  CheckCircle2,
  ChevronRight,
  Eye,
  Stethoscope,
  Zap,
  Trash2,
  SlidersHorizontal,
  Package,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Play,
  RotateCcw
} from 'lucide-react';
import api, { resolveFileUrl } from '@/lib/api';
import {
  DetailingCategory,
  DEFAULT_CATEGORIES,
  isProductInSpecialty
} from '@/lib/product-specialty-mapping';

export interface DoctorDetailingPlan {
  doctorId: string;
  doctorName?: string;
  selectedContentIds: string[];
  additionalProductNames?: string[];
  updatedAt: string;
}

export const getDoctorDetailingPlanKey = (doctorId: string) => `mr_detailing_plan_doc_${doctorId}`;

export function getDoctorDetailingPlan(doctorId: string): DoctorDetailingPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getDoctorDetailingPlanKey(doctorId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load doctor detailing plan:', err);
    return null;
  }
}

export function saveDoctorDetailingPlan(
  doctorId: string,
  plan: { selectedContentIds: string[]; additionalProductNames?: string[]; doctorName?: string }
): DoctorDetailingPlan {
  const data: DoctorDetailingPlan = {
    doctorId,
    doctorName: plan.doctorName,
    selectedContentIds: plan.selectedContentIds,
    additionalProductNames: plan.additionalProductNames || [],
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(getDoctorDetailingPlanKey(doctorId), JSON.stringify(data));
  }
  return data;
}

export function clearDoctorDetailingPlan(doctorId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getDoctorDetailingPlanKey(doctorId));
  }
}

const CONTENT_TYPE_LABELS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PRESENTATION: { label: 'Visual Aid', icon: Layers, color: '#7E22CE', bg: '#FAF5FF' },
  IMAGE: { label: 'Clinical Slide', icon: ImageIcon, color: '#047857', bg: '#ECFDF5' },
  VIDEO: { label: 'MoA Video', icon: Video, color: '#1D4ED8', bg: '#EFF6FF' },
  ANIMATION: { label: '3D Animation', icon: Zap, color: '#B45309', bg: '#FFFBEB' },
  PDF: { label: 'Monograph', icon: FileText, color: '#B91C1C', bg: '#FEF2F2' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
    category?: string;
    doctorCode?: string;
    hospital?: { name?: string } | string;
    city?: string;
    productsSelected?: any[];
  } | null;
  allContents?: any[];
  allProducts?: any[];
  categories?: DetailingCategory[];
  onPlanSaved?: (plan: DoctorDetailingPlan) => void;
}

export default function DoctorDetailingPlanModal({
  isOpen,
  onClose,
  doctor,
  allContents: propContents,
  allProducts: propProducts,
  categories: propCategories,
  onPlanSaved,
}: Props) {
  const qc = useQueryClient();

  const [activeMode, setActiveMode] = useState<'PRODUCTS' | 'SLIDES'>('SLIDES');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'PRESCRIBED' | 'ALL' | 'SELECTED'>('SELECTED');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [saving, setSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Fetch Contents if not passed
  const { data: fetchedContents = [] } = useQuery({
    queryKey: ['contents-for-plan'],
    queryFn: () => api.get('/content').then((r) => r.data.data || []),
    enabled: isOpen && !propContents,
  });
  const allContents = propContents || fetchedContents;

  // Fetch Products if not passed
  const { data: fetchedProductsData } = useQuery({
    queryKey: ['products-for-plan'],
    queryFn: () => api.get('/products', { params: { limit: 200 } }).then((r) => r.data.data || []),
    enabled: isOpen && !propProducts,
  });
  const allProducts = useMemo(() => {
    if (propProducts) return propProducts;
    if (Array.isArray(fetchedProductsData)) return fetchedProductsData;
    if (fetchedProductsData?.products && Array.isArray(fetchedProductsData.products)) {
      return fetchedProductsData.products;
    }
    return [];
  }, [propProducts, fetchedProductsData]);

  // Fetch Categories if not passed
  const { data: fetchedCategories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['detailing-categories-for-plan'],
    queryFn: () =>
      api
        .get('/content/categories')
        .then((r) => (Array.isArray(r.data.data) && r.data.data.length > 0 ? r.data.data : DEFAULT_CATEGORIES))
        .catch(() => DEFAULT_CATEGORIES),
    enabled: isOpen && !propCategories,
  });
  const categories = propCategories || fetchedCategories;

  // Identify doctor's primary specialty category
  const doctorCategory = useMemo(() => {
    if (!doctor) return categories[0];
    const code = (doctor.category || doctor.specialty || '').toUpperCase();
    return (
      categories.find(
        (c: DetailingCategory) =>
          c.code.toUpperCase() === code ||
          c.name.toUpperCase().includes(code) ||
          code.includes(c.code.toUpperCase())
      ) || categories[0]
    );
  }, [doctor, categories]);

  // Load existing plan & doctor's products on open
  useEffect(() => {
    if (!isOpen || !doctor?.id) return;
    setSaveSuccessNotice(false);

    let initialPIds: string[] = [];
    if (doctor.productsSelected && Array.isArray(doctor.productsSelected)) {
      initialPIds = doctor.productsSelected
        .map((p: any) => p.productId || p.product?.id || p.id)
        .filter(Boolean);
      setSelectedProductIds(initialPIds);
    }

    const savedPlan = getDoctorDetailingPlan(doctor.id);
    if (savedPlan && Array.isArray(savedPlan.selectedContentIds) && savedPlan.selectedContentIds.length > 0) {
      setSelectedIds(savedPlan.selectedContentIds);
      setActiveTab('SELECTED');
    } else if (initialPIds.length > 0) {
      // Pre-select slides matching assigned products
      const pIdSet = new Set(initialPIds);
      const selProds = allProducts.filter((p: any) => pIdSet.has(p.id));
      const pNames = selProds.map((p: any) => (p.name || '').toLowerCase().trim()).filter(Boolean);
      const bNames = selProds.map((p: any) => (p.brandName || '').toLowerCase().trim()).filter(Boolean);

      const matchingSlideIds = allContents
        .filter((c: any) => {
          if (c.productId && pIdSet.has(c.productId)) return true;
          const cName = (c.productName || c.title || '').toLowerCase();
          return (
            pNames.some((pn: string) => pn && cName.includes(pn)) ||
            bNames.some((bn: string) => bn && cName.includes(bn))
          );
        })
        .map((c: any) => c.id);

      setSelectedIds(matchingSlideIds);
      setActiveTab(matchingSlideIds.length > 0 ? 'SELECTED' : 'PRESCRIBED');
    } else {
      setSelectedIds([]);
      setActiveTab('PRESCRIBED');
    }
  }, [isOpen, doctor?.id]);

  // Prescribed products matching slide set
  const prescribedProductContentIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedProductIds.length === 0) return set;

    const selProductSet = new Set(selectedProductIds);
    const selProds = allProducts.filter((p: any) => selProductSet.has(p.id));
    const selNames = selProds.map((p: any) => (p.name || '').toLowerCase().trim()).filter(Boolean);
    const selBrands = selProds.map((p: any) => (p.brandName || '').toLowerCase().trim()).filter(Boolean);

    allContents.forEach((c: any) => {
      if (c.productId && selProductSet.has(c.productId)) {
        set.add(c.id);
        return;
      }
      const cName = (c.productName || c.title || '').toLowerCase();
      if (
        selNames.some((n: string) => n && cName.includes(n)) ||
        selBrands.some((b: string) => b && cName.includes(b))
      ) {
        set.add(c.id);
      }
    });
    return set;
  }, [selectedProductIds, allProducts, allContents]);

  // Content map for quick lookup
  const contentMap = useMemo(() => {
    const map = new Map<string, any>();
    allContents.forEach((c: any) => map.set(c.id, c));
    return map;
  }, [allContents]);

  // Toggle single slide
  const toggleContent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle product selection and sync slides
  const toggleProduct = (prod: any) => {
    const pId = prod.id;
    const pName = (prod.name || '').toLowerCase().trim();
    const brandName = (prod.brandName || '').toLowerCase().trim();

    setSelectedProductIds((prev) => {
      const isAdding = !prev.includes(pId);
      const nextProductIds = isAdding ? [...prev, pId] : prev.filter((id) => id !== pId);

      // Auto-sync matching slides
      setSelectedIds((prevSlides) => {
        const matchingSlideIds = allContents
          .filter((c: any) => {
            if (c.productId && c.productId === pId) return true;
            const cName = (c.productName || c.title || '').toLowerCase();
            return (pName && cName.includes(pName)) || (brandName && cName.includes(brandName));
          })
          .map((c: any) => c.id);

        if (isAdding) {
          return Array.from(new Set([...prevSlides, ...matchingSlideIds]));
        } else {
          return prevSlides.filter((id) => !matchingSlideIds.includes(id));
        }
      });

      return nextProductIds;
    });
  };

  // Select all slides matching prescribed products
  const handleSelectAllPrescribed = () => {
    const prescribedArr = Array.from(prescribedProductContentIds);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...prescribedArr])));
  };

  // Clear all slides
  const handleClearAllSlides = () => {
    setSelectedIds([]);
  };

  // Reorder slides
  const moveSlideUp = (contentId: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(contentId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const moveSlideDown = (contentId: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(contentId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  // Filtered slides list
  const displayedContents = useMemo(() => {
    const filtered = allContents.filter((c: any) => {
      if (c.isDisabled) return false;

      // Tab filter
      if (activeTab === 'SELECTED') {
        if (!selectedIds.includes(c.id)) return false;
      } else if (activeTab === 'PRESCRIBED') {
        if (selectedProductIds.length > 0 && !prescribedProductContentIds.has(c.id)) return false;
      }

      // Category filter within all
      if (selectedCategoryCode !== 'ALL') {
        const prodName = c.productName || c.title || '';
        if (!isProductInSpecialty(prodName, selectedCategoryCode, categories)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'PRESENTATION') {
          if (c.contentType !== 'PRESENTATION' && c.contentType !== 'IMAGE') return false;
        } else if (c.contentType !== typeFilter) {
          return false;
        }
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (c.title || '').toLowerCase();
        const prod = (c.productName || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return title.includes(q) || prod.includes(q) || desc.includes(q);
      }

      return true;
    });

    if (activeTab === 'SELECTED') {
      return [...filtered].sort((a: any, b: any) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
    }

    return filtered;
  }, [
    allContents,
    activeTab,
    selectedIds,
    selectedProductIds,
    prescribedProductContentIds,
    selectedCategoryCode,
    typeFilter,
    search,
    categories
  ]);

  // Filtered products list for mode 1
  const displayedProducts = useMemo(() => {
    return allProducts.filter((p: any) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brandName || '').toLowerCase();
      const code = (p.productCode || '').toLowerCase();
      return name.includes(q) || brand.includes(q) || code.includes(q);
    });
  }, [allProducts, search]);

  // Save Detailing Plan
  const handleSavePlan = async () => {
    if (!doctor?.id) return;
    setSaving(true);
    try {
      // 1. Update doctor's assigned products in PostgreSQL
      await api
        .put(`/doctors/${doctor.id}`, {
          productIds: selectedProductIds,
        })
        .catch((err) => {
          console.warn('Could not update doctor products in DB:', err);
        });

      // 2. Save curated slide deck in localStorage
      const saved = saveDoctorDetailingPlan(doctor.id, {
        selectedContentIds: selectedIds,
        additionalProductNames: [],
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      });

      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctor', doctor.id] });

      if (onPlanSaved) {
        onPlanSaved(saved);
      }
      setSaveSuccessNotice(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save doctor detailing plan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !doctor) return null;

  const hospName = typeof doctor.hospital === 'object' ? doctor.hospital?.name : doctor.hospital;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] max-h-[920px] flex flex-col overflow-hidden">
        {/* ── TOP HEADER ── */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Detailing Slide Set & Plan — Dr. {doctor.firstName} {doctor.lastName}
                </h2>
                {doctor.doctorCode && (
                  <span className="font-mono text-[11px] font-bold bg-white/10 px-2 py-0.5 rounded-md text-emerald-300">
                    {doctor.doctorCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Specialty: <span className="text-emerald-400 font-semibold">{doctor.category || doctor.specialty || 'General Medicine'}</span>
                {hospName && ` • ${hospName}`}
                {doctor.city && ` (${doctor.city})`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── MODE SWITCHER & STATS BAR ── */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveMode('SLIDES')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMode === 'SLIDES'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Detailing Slide Deck ({selectedIds.length} Slides)
            </button>

            <button
              onClick={() => setActiveMode('PRODUCTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMode === 'PRODUCTS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Prescribed Medicines ({selectedProductIds.length})
            </button>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{selectedProductIds.length} Prescribed Medicines</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedIds.length} Curated Detailing Slides</span>
            </div>
          </div>
        </div>

        {/* ── SUB-CONTROLS & TABS (FOR SLIDES MODE) ── */}
        {activeMode === 'SLIDES' && (
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            {/* Slide Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('SELECTED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === 'SELECTED'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Curated Slide Deck ({selectedIds.length})
              </button>

              <button
                onClick={() => setActiveTab('PRESCRIBED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === 'PRESCRIBED'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Prescribed Medicines Slides ({prescribedProductContentIds.size})
              </button>

              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === 'ALL'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Detailing Slides ({allContents.length})
              </button>
            </div>

            {/* Quick Slide Batch Actions */}
            <div className="flex items-center gap-2">
              {prescribedProductContentIds.size > 0 && (
                <button
                  onClick={handleSelectAllPrescribed}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                >
                  + Add All Prescribed ({prescribedProductContentIds.size})
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  onClick={handleClearAllSlides}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SEARCH & CATEGORY FILTERS BAR ── */}
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeMode === 'PRODUCTS'
                  ? 'Search Biocros medicines or brand names...'
                  : 'Search visual aids, clinical slides, formulations...'
              }
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
          </div>

          {activeMode === 'SLIDES' && activeTab === 'ALL' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <select
                value={selectedCategoryCode}
                onChange={(e) => setSelectedCategoryCode(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c: DetailingCategory) => (
                  <option key={c.id || c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Slide Formats</option>
                <option value="PRESENTATION">Visual Aids</option>
                <option value="IMAGE">Clinical Slides</option>
                <option value="VIDEO">MoA Videos</option>
                <option value="ANIMATION">3D Animations</option>
                <option value="PDF">Monographs</option>
              </select>
            </div>
          )}
        </div>

        {/* ── MAIN BODY CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {activeMode === 'PRODUCTS' ? (
            /* ──────────────── MODE 1: PRODUCTS SELECTION LIST ──────────────── */
            <div className="space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Select all medicines prescribed by Dr. {doctor.lastName}. Matching detailing slides will automatically be curated into the doctor&apos;s detailing deck.
                </div>
                <span className="font-bold text-emerald-800">
                  {selectedProductIds.length} Selected
                </span>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-slate-700">No medicines found</p>
                  <p className="text-xs text-slate-400 mt-1">Try another search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedProducts.map((prod: any) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    const matchingSlidesCount = allContents.filter((c: any) => {
                      if (c.productId && c.productId === prod.id) return true;
                      const cName = (c.productName || c.title || '').toLowerCase();
                      const pName = (prod.name || '').toLowerCase();
                      const bName = (prod.brandName || '').toLowerCase();
                      return (pName && cName.includes(pName)) || (bName && cName.includes(bName));
                    }).length;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProduct(prod)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                            : 'bg-white border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {prod.name}
                            </h4>
                            {prod.brandName && (
                              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                                {prod.brandName}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {prod.productCode || 'RX'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                matchingSlidesCount > 0
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}>
                                {matchingSlidesCount} Slides
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ──────────────── MODE 2: DETAILING SLIDES CURATION LIST ──────────────── */
            <div className="space-y-3">
              {activeTab === 'SELECTED' && (
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>
                      <strong>Slide Sequence Deck:</strong> These slides will be presented in this exact order during detailing calls. Use the up/down buttons to reorder.
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded">
                    {selectedIds.length} Slides in Set
                  </span>
                </div>
              )}

              {displayedContents.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400">
                  <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-slate-700">
                    {activeTab === 'SELECTED'
                      ? 'No detailing slides in this doctor deck yet'
                      : activeTab === 'PRESCRIBED'
                      ? 'No slides matching prescribed medicines'
                      : 'No detailing slides found'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {activeTab === 'SELECTED'
                      ? 'Switch to "Prescribed Medicines Slides" or "All Detailing Slides" above to add slides to Dr. ' + doctor.lastName + "'s slide set."
                      : 'Select prescribed medicines in the top tab or adjust search filters.'}
                  </p>
                  {activeTab === 'SELECTED' && prescribedProductContentIds.size > 0 && (
                    <button
                      onClick={handleSelectAllPrescribed}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      + Load All Prescribed Slides ({prescribedProductContentIds.size})
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedContents.map((content: any, index: number) => {
                    const isSelected = selectedIds.includes(content.id);
                    const sequenceIndex = isSelected ? selectedIds.indexOf(content.id) + 1 : null;
                    const config = CONTENT_TYPE_LABELS[content.contentType] || CONTENT_TYPE_LABELS.IMAGE;
                    const TypeIcon = config.icon;
                    const fullUrl = resolveFileUrl(content.thumbnailUrl || content.fileUrl);

                    return (
                      <div
                        key={content.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-white border-emerald-400 shadow-sm ring-1 ring-emerald-500/10'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Left: Sequence index & Checkbox */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleContent(content.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white hover:border-emerald-500'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>

                          {activeTab === 'SELECTED' && sequenceIndex && (
                            <span className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {sequenceIndex}
                            </span>
                          )}

                          {/* Slide Thumbnail */}
                          <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative flex-shrink-0 flex items-center justify-center">
                            {fullUrl ? (
                              <img
                                src={fullUrl}
                                alt={content.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <TypeIcon className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          {/* Slide Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {content.title}
                              </h4>
                              <span
                                style={{ backgroundColor: config.bg, color: config.color }}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0"
                              >
                                {config.label}
                              </span>
                            </div>

                            <p className="text-xs text-emerald-700 font-semibold mt-0.5 truncate">
                              {content.productName || 'Biocros Clinical Visual Aid'}
                            </p>

                            {content.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {content.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Sequence Reorder Controls (when in Selected tab) */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {activeTab === 'SELECTED' && (
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                              <button
                                onClick={() => moveSlideUp(content.id)}
                                disabled={sequenceIndex === 1}
                                className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Earlier in Presentation"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveSlideDown(content.id)}
                                disabled={sequenceIndex === selectedIds.length}
                                className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Later in Presentation"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => toggleContent(content.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isSelected ? 'Remove' : '+ Add to Deck'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            {saveSuccessNotice ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Detailing slide set saved successfully!
              </span>
            ) : (
              <span>
                Configured for <strong>Dr. {doctor.firstName} {doctor.lastName}</strong> ({selectedProductIds.length} products, {selectedIds.length} slides)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSavePlan}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Detailing Plan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Save Detailing Slide Deck
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
