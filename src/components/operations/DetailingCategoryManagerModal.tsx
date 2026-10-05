'use client';

import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Plus,
  Check,
  Trash2,
  FolderPlus,
  Layers,
  Sparkles,
  ChevronRight,
  Edit3,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import api from '@/lib/api';
import { DetailingCategory } from '@/lib/product-specialty-mapping';

const COLOR_PRESETS = [
  '#EC4899', // Pink (Gyno)
  '#2563EB', // Blue (Gen Med)
  '#F59E0B', // Amber (Pediatric)
  '#9333EA', // Purple (Gastro)
  '#059669', // Emerald (ENT)
  '#EA580C', // Orange (Ortho)
  '#E11D48', // Red (Cardio)
  '#0D9488', // Teal
  '#4F46E5', // Indigo
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: DetailingCategory[];
  allContents?: any[];
  allProducts?: any[];
}

export default function DetailingCategoryManagerModal({
  isOpen,
  onClose,
  categories,
  allContents = [],
  allProducts = [],
}: Props) {
  const qc = useQueryClient();

  const [editingCategory, setEditingCategory] = useState<DetailingCategory | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [mappedProducts, setMappedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all available product names from contents and products
  const availableProductNames = useMemo(() => {
    const set = new Set<string>();
    allContents.forEach((c: any) => {
      const name = c.productName || c.title;
      if (name) set.add(name.trim());
    });
    allProducts.forEach((p: any) => {
      if (p.name) set.add(p.name.trim());
      if (p.brandName) set.add(p.brandName.trim());
    });
    // Add default products from categories as well
    categories.forEach((c: DetailingCategory) => {
      if (c.productNames && Array.isArray(c.productNames)) {
        c.productNames.forEach((p) => set.add(p.trim()));
      }
    });
    return Array.from(set).sort();
  }, [allContents, allProducts, categories]);

  const handleOpenEdit = (cat: DetailingCategory) => {
    setEditingCategory(cat);
    setIsCreatingNew(false);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setSelectedColor(cat.color || COLOR_PRESETS[0]);
    setMappedProducts([...(cat.productNames || [])]);
    setProductSearch('');
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsCreatingNew(true);
    setCategoryName('');
    setCategoryDesc('');
    setSelectedColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    setMappedProducts([]);
    setProductSearch('');
  };

  const handleCloseEditor = () => {
    setEditingCategory(null);
    setIsCreatingNew(false);
  };

  const toggleProduct = (prodName: string) => {
    setMappedProducts((prev) =>
      prev.includes(prodName) ? prev.filter((p) => p !== prodName) : [...prev, prodName]
    );
  };

  const handleSelectAll = () => {
    if (mappedProducts.length === availableProductNames.length) {
      setMappedProducts([]);
    } else {
      setMappedProducts([...availableProductNames]);
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!categoryName.trim()) {
        throw new Error('Please provide a category name');
      }

      const code = (editingCategory?.code || categoryName).toUpperCase().replace(/[^A-Z0-9]/g, '_');

      if (isCreatingNew) {
        const res = await api.post('/content/categories', {
          name: categoryName.trim(),
          code,
          description: categoryDesc.trim(),
          productNames: mappedProducts,
          color: selectedColor,
        });
        return res.data;
      } else if (editingCategory && (editingCategory.id || editingCategory.code)) {
        const catId = editingCategory.id || editingCategory.code;
        const res = await api.put(`/content/categories/${catId}`, {
          name: categoryName.trim(),
          description: categoryDesc.trim(),
          productNames: mappedProducts,
          color: selectedColor,
        });
        return res.data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['detailing-categories'] });
      qc.invalidateQueries({ queryKey: ['detailing-categories-list'] });
      qc.invalidateQueries({ queryKey: ['contents'] });
      handleCloseEditor();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to save category');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/content/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['detailing-categories'] });
      qc.invalidateQueries({ queryKey: ['detailing-categories-list'] });
      setDeletingId(null);
      handleCloseEditor();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete category');
    },
  });

  const filteredProducts = availableProductNames.filter((p) =>
    p.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[88vh] max-h-[850px] flex flex-col overflow-hidden">
        {/* ── HEADER ── */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {editingCategory || isCreatingNew ? 'Edit Category & Detailing Slides Mapping' : 'Detailing Categories & Product Decks'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingCategory || isCreatingNew
                  ? 'Map Biocros pharmaceutical products and visual aid slides to this specialty'
                  : 'Manage medical specialty categories and detailing slide assignments'}
              </p>
            </div>
          </div>

          <button
            onClick={editingCategory || isCreatingNew ? handleCloseEditor : onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ── */}
        {!editingCategory && !isCreatingNew ? (
          /* ── 1. ALL CATEGORIES LIST VIEW ── */
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
            {/* Create New Category Action Card */}
            <div
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-md shadow-emerald-700/15 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <FolderPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:underline">
                    + Create New Detailing Category
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Add new medical specialty (e.g. Oncology, Nephrology) and map relevant slides
                  </p>
                </div>
              </div>
              <Plus className="w-5 h-5 text-white" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Detailing Specialties ({categories.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {categories.map((cat: DetailingCategory) => {
                const prodCount = cat.productNames?.length || 0;
                return (
                  <div
                    key={cat.id || cat.code}
                    onClick={() => handleOpenEdit(cat)}
                    className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        style={{ backgroundColor: cat.color || '#059669' }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                      >
                        <Sparkles className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {cat.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {cat.description || 'Specialized detailing slide deck'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                            {prodCount} Medicines Mapped
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cat.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── 2. EDIT / CREATE CATEGORY EDITOR ── */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
            {/* Category Basic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category / Specialty Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Gynecology & Obstetrics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specialty Color Tag
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        selectedColor === color
                          ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Description & Indications
              </label>
              <textarea
                rows={2}
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
                placeholder="Brief summary of therapeutic scope and formulations covered..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Mapped Medicines Selection Box */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    Mapped Medicines & Formulations ({mappedProducts.length} Selected)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Any digital detailing slides referencing these medicines will automatically be featured under this specialty.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    {mappedProducts.length === availableProductNames.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Product Search */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter available medicines..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Products List Grid */}
              <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50/50">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    No medicines match &quot;{productSearch}&quot;
                  </div>
                ) : (
                  filteredProducts.map((pName) => {
                    const isChecked = mappedProducts.includes(pName);
                    return (
                      <div
                        key={pName}
                        onClick={() => toggleProduct(pName)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{pName}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          {editingCategory || isCreatingNew ? (
            <>
              <div>
                {editingCategory && (editingCategory.id || editingCategory.code) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to deactivate "${editingCategory.name}"?`)) {
                        deleteMutation.mutate(editingCategory.id || editingCategory.code);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Deactivate Category
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" /> Save Category Mappings
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-slate-500 font-medium">
                {categories.length} Detailing categories configured
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
