'use client';

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import api, { resolveFileUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Play,
  FileText,
  Video,
  Image as ImageIcon,
  Search,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Share2,
  Sparkles,
  Layers,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  List,
  Clock,
  Stethoscope,
  ExternalLink,
  Zap,
  Check,
  ChevronDown,
  FolderKanban,
  CheckCircle,
  SlidersHorizontal,
  Plus,
  Loader2,
  ArrowRight,
  Upload,
  UserCheck
} from 'lucide-react';
import DetailingCategoryManagerModal from '@/components/operations/DetailingCategoryManagerModal';
import DoctorDetailingPlanModal, {
  DoctorDetailingPlan,
  getDoctorDetailingPlan
} from '@/components/operations/DoctorDetailingPlanModal';
import {
  DetailingCategory,
  DEFAULT_CATEGORIES,
  SPECIALTY_CATEGORIES,
  normalizeDoctorSpecialty,
  isProductInSpecialty,
  filterContentBySpecialty,
  getSpecialtySlideCounts,
} from '@/lib/product-specialty-mapping';

const CONTENT_TYPE_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; badgeBg: string }> = {
  PRESENTATION: {
    label: 'Visual Aid',
    icon: Layers,
    bg: '#FAF5FF',
    text: '#7E22CE',
    badgeBg: '#F3E8FF',
  },
  IMAGE: {
    label: 'Clinical Slide',
    icon: ImageIcon,
    bg: '#ECFDF5',
    text: '#047857',
    badgeBg: '#D1FAE5',
  },
  VIDEO: {
    label: 'MoA Video',
    icon: Video,
    bg: '#EFF6FF',
    text: '#1D4ED8',
    badgeBg: '#DBEAFE',
  },
  ANIMATION: {
    label: '3D Animation',
    icon: Zap,
    bg: '#FFFBEB',
    text: '#B45309',
    badgeBg: '#FEF3C7',
  },
  PDF: {
    label: 'Monograph',
    icon: FileText,
    bg: '#FEF2F2',
    text: '#B91C1C',
    badgeBg: '#FEE2E2',
  },
};

const TOP_PRODUCTS = [
  'Biospore 4 Tablet',
  'Biospore 4 Sachet',
  'Montecros L',
  'Veepros D3',
  'Rinovac Tablet',
  'Rinovac Plus',
  'Benzylac Tablet',
  'Alkatage 200 ml',
  'Pncros 40',
  'Argicros Pink Sachet',
  'Biofit Plus F',
  'Calcical Tablet',
];

function DigitalDetailingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const isManager = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'MARKETING'].includes(user?.role || '');

  // Params from Visit journey or Doctor call
  const entityName = searchParams.get('entityName');
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');
  const specialtyParam = searchParams.get('specialty');
  const categoryParam = searchParams.get('category');
  const activeCategoryParam = searchParams.get('activeCategory');
  const usePlanParam = searchParams.get('usePlan');

  // Modals state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [detailingPlanModalVisible, setDetailingPlanModalVisible] = useState(false);
  const [selectedDoctorForPlan, setSelectedDoctorForPlan] = useState<any | null>(null);
  const [doctorPlan, setDoctorPlan] = useState<DoctorDetailingPlan | null>(null);

  // Upload modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'PRESENTATION',
    fileUrl: '',
    productName: '',
    campaignId: '',
    version: '1.0',
  });

  // Presentation State
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'deck'>('cards');

  // Doctor Selector Modal for Admin when configuring without direct query param
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Fetch detailing categories
  const { data: dynamicCategories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['detailing-categories'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/categories');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data as DetailingCategory[];
        }
      } catch (err) {
        console.warn('Using default detailing categories:', err);
      }
      return DEFAULT_CATEGORIES;
    },
    staleTime: 60_000,
  });

  // Doctor context memo
  const doctorContext = useMemo(() => {
    if (!entityId) return selectedDoctorForPlan;
    const cleanName = (entityName ? decodeURIComponent(entityName) : '').replace(/^Dr\.\s*/i, '').trim();
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || 'Doctor';
    const lastName = nameParts.slice(1).join(' ') || '';
    return {
      id: entityId,
      firstName,
      lastName,
      specialty: specialtyParam ? decodeURIComponent(specialtyParam) : undefined,
      category: categoryParam ? decodeURIComponent(categoryParam) : undefined,
    };
  }, [entityId, entityName, specialtyParam, categoryParam, selectedDoctorForPlan]);

  // Doctor specialty detection
  const detectedSpecialty = useMemo(() => {
    if (activeCategoryParam && activeCategoryParam !== 'ALL') {
      return activeCategoryParam;
    }
    return normalizeDoctorSpecialty(specialtyParam || undefined, categoryParam || undefined, dynamicCategories);
  }, [activeCategoryParam, specialtyParam, categoryParam, dynamicCategories]);

  const [specialtyFilter, setSpecialtyFilter] = useState<string>(() => detectedSpecialty);

  // Sync specialty filter if params change
  useEffect(() => {
    if (detectedSpecialty && detectedSpecialty !== 'ALL') {
      setSpecialtyFilter(detectedSpecialty);
    }
  }, [detectedSpecialty]);

  // Load doctor's detailing plan
  useEffect(() => {
    const docId = entityId || selectedDoctorForPlan?.id;
    if (docId) {
      const plan = getDoctorDetailingPlan(docId);
      setDoctorPlan(plan);
      if (plan && plan.selectedContentIds?.length > 0 && (usePlanParam === 'true' || !activeCategoryParam)) {
        setSpecialtyFilter('MY_PLAN');
      }
    }
  }, [entityId, selectedDoctorForPlan, usePlanParam, activeCategoryParam]);

  // Timer for Detailing Session
  useEffect(() => {
    let interval: any = null;
    if (presenterOpen) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
      setShowKeyPoints(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [presenterOpen]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Fetch all contents
  const { data: contents = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['contents'],
    queryFn: async () => {
      const res = await api.get('/content');
      return res.data?.data || [];
    },
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/content/campaigns/list').then((r) => r.data?.data || []),
  });

  // Fetch doctors list for doctor selector modal
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-selector-list', docSearchQuery],
    queryFn: () =>
      api.get('/doctors', { params: { search: docSearchQuery || undefined, limit: 30 } }).then((r) => r.data?.data),
    enabled: showDoctorPicker,
  });
  const doctorPickerList = doctorsData?.doctors || [];

  // Log view mutation
  const logContentView = useCallback(
    (contentId: string) => {
      api
        .get(`/content/${contentId}`)
        .then(() => qc.invalidateQueries({ queryKey: ['contents'] }))
        .catch(() => {});
    },
    [qc]
  );

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', form.title.trim());
        formData.append('contentType', form.contentType);
        formData.append('version', form.version || '1.0');
        if (form.description.trim()) formData.append('description', form.description.trim());
        if (form.productName.trim()) formData.append('productName', form.productName.trim());
        if (form.campaignId) formData.append('campaignId', form.campaignId);

        return api.post('/content/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        return api.post('/content', {
          ...form,
          isActive: true,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contents'] });
      setShowAddForm(false);
      setUploadFile(null);
      setForm({
        title: '',
        description: '',
        contentType: 'PRESENTATION',
        fileUrl: '',
        productName: '',
        campaignId: '',
        version: '1.0',
      });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to upload content');
    },
  });

  // Filtered contents based on category, format, campaign, search
  const filteredContents = useMemo(() => {
    return contents.filter((c: any) => {
      if (c.isDisabled) return false;

      // Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'PRESENTATION') {
          if (c.contentType !== 'PRESENTATION' && c.contentType !== 'IMAGE') return false;
        } else if (c.contentType !== typeFilter) {
          return false;
        }
      }

      // Campaign filter
      if (selectedCampaign !== 'ALL' && c.campaignId !== selectedCampaign) return false;

      // Specialty category / My Plan filter
      if (specialtyFilter === 'MY_PLAN') {
        if (!doctorPlan?.selectedContentIds?.includes(c.id)) return false;
      } else if (specialtyFilter !== 'ALL') {
        const prodName = c.productName || c.title || '';
        if (!isProductInSpecialty(prodName, specialtyFilter, dynamicCategories)) return false;
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
  }, [contents, typeFilter, selectedCampaign, specialtyFilter, search, dynamicCategories, doctorPlan]);

  // Order slides according to Doctor Plan if in MY_PLAN
  const sortedContents = useMemo(() => {
    if (specialtyFilter === 'MY_PLAN' && doctorPlan?.selectedContentIds) {
      return [...filteredContents].sort(
        (a: any, b: any) =>
          doctorPlan.selectedContentIds.indexOf(a.id) - doctorPlan.selectedContentIds.indexOf(b.id)
      );
    }
    return filteredContents;
  }, [filteredContents, specialtyFilter, doctorPlan]);

  const specialtyCounts = useMemo(
    () => getSpecialtySlideCounts(contents, dynamicCategories),
    [contents, dynamicCategories]
  );

  // Strategic KPI Metrics
  const totalMaterials = contents.length;
  const activeCampaignsCount = campaigns.length;
  const totalViewsLogged = useMemo(() => {
    return contents.reduce((acc: number, c: any) => acc + (c._count?.views || 0), 0);
  }, [contents]);

  // Open Interactive Presenter Modal
  const handleStartPresenting = useCallback(
    (content: any, index: number) => {
      logContentView(content.id);
      setActiveSlideIndex(index);
      setPresenterOpen(true);
    },
    [logContentView]
  );

  // Presenter navigation
  const activeSlide = activeSlideIndex !== null ? sortedContents[activeSlideIndex] : null;

  const handleNextSlide = useCallback(() => {
    if (activeSlideIndex !== null && activeSlideIndex < sortedContents.length - 1) {
      const nextIdx = activeSlideIndex + 1;
      setActiveSlideIndex(nextIdx);
      logContentView(sortedContents[nextIdx]?.id);
    }
  }, [activeSlideIndex, sortedContents, logContentView]);

  const handlePrevSlide = useCallback(() => {
    if (activeSlideIndex !== null && activeSlideIndex > 0) {
      const prevIdx = activeSlideIndex - 1;
      setActiveSlideIndex(prevIdx);
      logContentView(sortedContents[prevIdx]?.id);
    }
  }, [activeSlideIndex, sortedContents, logContentView]);

  // Keyboard navigation for presenter
  useEffect(() => {
    if (!presenterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        setPresenterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presenterOpen, handleNextSlide, handlePrevSlide]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16">
      {/* ── TOP EXECUTIVE CONTROL HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Play className="w-6 h-6 text-emerald-600 fill-emerald-600" /> Digital Detailing
            </h1>
            <span className="bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> e-Detailing Pro
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Biocros clinical visual aids, mechanisms of action, and tailored doctor slide decks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Doctor Slide Set / Plan button */}
          <button
            onClick={() => {
              if (doctorContext) {
                setDetailingPlanModalVisible(true);
              } else {
                setShowDoctorPicker(true);
              }
            }}
            className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            {doctorContext ? `Curate Slide Deck (Dr. ${doctorContext.lastName})` : 'Set Doctor Slide Deck'}
          </button>

          {/* Manage Categories button */}
          <button
            onClick={() => setCategoryModalVisible(true)}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Manage Categories
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Showcase Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('deck')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'deck' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Slide Deck Ledger"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Button */}
          {isManager && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Upload Content
            </button>
          )}
        </div>
      </div>

      {/* ── DOCTOR CALL LIVE CONTEXT BANNER ── */}
      {doctorContext && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                    {entityType || 'Doctor'} Detailing Call Session
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Dr. {doctorContext.firstName} {doctorContext.lastName}
                  {doctorContext.specialty && (
                    <span className="text-xs text-emerald-300 font-normal ml-2">
                      ({doctorContext.specialty})
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDetailingPlanModalVisible(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Customize Slide Set ({doctorPlan?.selectedContentIds?.length || 0} slides)
              </button>

              {entityId && (
                <button
                  onClick={() => router.back()}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                >
                  End Call
                </button>
              )}
            </div>
          </div>

          {/* Plan or Specialty Active Status Bar */}
          <div className="flex items-center justify-between bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-xs">
            {specialtyFilter === 'MY_PLAN' && doctorPlan ? (
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Curated Doctor Deck Active:</strong> Displaying {doctorPlan.selectedContentIds.length} tailored slides in doctor sequence.
                </span>
              </div>
            ) : specialtyFilter !== 'ALL' ? (
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Specialty Deck:</strong> Filtered by {SPECIALTY_CATEGORIES[specialtyFilter]?.label || specialtyFilter}
                </span>
              </div>
            ) : (
              <span className="text-slate-300">
                Browsing all catalog visual aids. Select &quot;My Plan&quot; to show doctor-specific deck.
              </span>
            )}

            <div className="flex items-center gap-3">
              {doctorPlan && doctorPlan.selectedContentIds.length > 0 && specialtyFilter !== 'MY_PLAN' && (
                <button
                  onClick={() => setSpecialtyFilter('MY_PLAN')}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  Activate My Plan
                </button>
              )}
              {specialtyFilter !== 'ALL' && (
                <button
                  onClick={() => setSpecialtyFilter('ALL')}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  Show All Slides
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4 STRATEGIC DETAILING KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visual Aids</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalMaterials}</h3>
            <p className="text-[11px] font-semibold text-purple-700 mt-0.5">Active Slide Decks</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campaigns</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeCampaignsCount}</h3>
            <p className="text-[11px] font-semibold text-blue-700 mt-0.5">Target Marketing</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doctor Views</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalViewsLogged}</h3>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Presentations Delivered</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Field Readiness</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">100%</h3>
            <p className="text-[11px] font-semibold text-amber-700 mt-0.5">Cloud Synced & Live</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── SEARCH & DYNAMIC FILTER BAR ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Biocros Product, Slide Title, Indication, or Clinical Formula..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Specialty & Doctor Category Filter Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Doctor Specialty Categories & Slide Decks:
            </span>
            {specialtyFilter !== 'ALL' && (
              <button
                onClick={() => setSpecialtyFilter('ALL')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Reset Specialty
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5">
            {/* MY PLAN CHIP */}
            {doctorPlan && doctorPlan.selectedContentIds?.length > 0 && (
              <button
                onClick={() => setSpecialtyFilter('MY_PLAN')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                  specialtyFilter === 'MY_PLAN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Doctor Plan</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    specialtyFilter === 'MY_PLAN' ? 'bg-white/30 text-white' : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {doctorPlan.selectedContentIds.length}
                </span>
              </button>
            )}

            {/* ALL CHIP */}
            <button
              onClick={() => setSpecialtyFilter('ALL')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                specialtyFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>All Products</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  specialtyFilter === 'ALL' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {contents.length}
              </span>
            </button>

            {/* DYNAMIC CATEGORY CHIPS */}
            {dynamicCategories.map((cat: DetailingCategory) => {
              const isSel = specialtyFilter === cat.code;
              const count = specialtyCounts[cat.code] ?? 0;
              return (
                <button
                  key={cat.id || cat.code}
                  onClick={() => setSpecialtyFilter(cat.code)}
                  style={{
                    backgroundColor: isSel ? cat.color || '#059669' : '#FFFFFF',
                    borderColor: isSel ? cat.color || '#059669' : '#E2E8F0',
                    color: isSel ? '#FFFFFF' : '#334155',
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-xs`}
                >
                  <span>{cat.name}</span>
                  <span
                    style={{
                      backgroundColor: isSel ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                      color: isSel ? '#FFFFFF' : '#64748B',
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold"
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format category pills & Campaign filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                typeFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Formats ({contents.length})
            </button>

            {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isSel = typeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSel
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {campaigns.length > 0 && (
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="ALL">All Campaigns ({campaigns.length})</option>
              {campaigns.map((camp: any) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── CONTENT BODY ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : sortedContents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Detailing Slides Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or reset the specialty category filter above.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('ALL');
              setSpecialtyFilter('ALL');
              setSelectedCampaign('ALL');
            }}
            className="mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── VIEW 1: VISUAL AID SHOWCASE CARDS ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedContents.map((content: any, index: number) => {
            const config = CONTENT_TYPE_CONFIG[content.contentType] || CONTENT_TYPE_CONFIG.IMAGE;
            const TypeIcon = config.icon;
            const fullUrl = resolveFileUrl(content.thumbnailUrl || content.fileUrl);

            return (
              <div
                key={content.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Thumbnail */}
                <div
                  onClick={() => handleStartPresenting(content, index)}
                  className="h-44 bg-slate-900 relative cursor-pointer flex items-center justify-center overflow-hidden"
                >
                  {fullUrl ? (
                    <img
                      src={fullUrl}
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <TypeIcon className="w-10 h-10 text-slate-500 mb-1" />
                      <span className="text-xs text-slate-400 font-bold">{content.title}</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span
                      style={{ backgroundColor: config.badgeBg, color: config.text }}
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-white/60 shadow-xs"
                    >
                      {config.label}
                    </span>

                    {specialtyFilter === 'MY_PLAN' && (
                      <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-xs">
                        Slide #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Hover Center Play Button */}
                  <div className="w-12 h-12 rounded-2xl bg-white/95 text-emerald-700 flex items-center justify-center shadow-lg border border-white group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-emerald-600 ml-0.5" />
                  </div>

                  {/* Product Label in Image */}
                  {content.productName && (
                    <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20">
                      <span className="text-[11px] font-black text-emerald-400 tracking-wide uppercase">
                        {content.productName}
                      </span>
                    </div>
                  )}

                  {/* Views Count */}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] text-slate-300 border border-white/10 font-bold">
                    <Eye className="w-3 h-3" />
                    <span>{content._count?.views || 0}</span>
                  </div>
                </div>

                {/* Card Meta & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {content.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {content.description || 'Clinical mechanism of action, pharmacology, and indications presentation.'}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      v{content.version || '1.0'}
                    </span>

                    <button
                      onClick={() => handleStartPresenting(content, index)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-white" /> Present
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VIEW 2: COMPACT SLIDE DECK LEDGER ── */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Seq</th>
                <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Slide Details</th>
                <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Product</th>
                <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Format</th>
                <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Campaign</th>
                <th className="text-right px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Views</th>
                <th className="text-right px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedContents.map((content: any, index: number) => {
                const config = CONTENT_TYPE_CONFIG[content.contentType] || CONTENT_TYPE_CONFIG.IMAGE;
                const fullUrl = resolveFileUrl(content.thumbnailUrl || content.fileUrl);

                return (
                  <tr key={content.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-400">
                      #{index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => handleStartPresenting(content, index)}
                          className="w-12 h-9 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer flex-shrink-0 flex items-center justify-center"
                        >
                          {fullUrl ? (
                            <img src={fullUrl} alt={content.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{content.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{content.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {content.productName || 'General'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        style={{ backgroundColor: config.badgeBg, color: config.text }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase"
                      >
                        {config.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {content.campaign?.name || 'Core Detailing'}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                      {content._count?.views || 0}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStartPresenting(content, index)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <Play className="w-3 h-3 fill-white" /> Present
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FULLSCREEN INTERACTIVE CLINICAL DETAILING PRESENTER MODAL ── */}
      {presenterOpen && activeSlide && (
        <div className="fixed inset-0 z-50 bg-[#090D16] text-white flex flex-col justify-between animate-in fade-in duration-200 select-none">
          {/* Top Presenter Bar */}
          <div className="px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between z-20">
            {/* Exit Detailing */}
            <button
              onClick={() => setPresenterOpen(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
            >
              <X className="w-4 h-4" /> Exit
            </button>

            {/* Slide Title & Product */}
            <div className="text-center px-4">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                {activeSlide.productName || 'Biocros Formulation'}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-xl">
                {activeSlide.title}
              </h2>
            </div>

            {/* Session Timer & Slide Counter */}
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-950/90 border border-emerald-700/60 px-3 py-1 rounded-xl flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTimer(sessionSeconds)}</span>
              </div>

              <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-xs font-bold text-slate-300">
                Slide {(activeSlideIndex ?? 0) + 1} / {sortedContents.length}
              </div>
            </div>
          </div>

          {/* Center Main Stage */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-black">
            {/* Slide Display */}
            {activeSlide.contentType === 'VIDEO' ? (
              <video
                src={resolveFileUrl(activeSlide.fileUrl)}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-2xl shadow-2xl"
              />
            ) : activeSlide.contentType === 'PDF' && !activeSlide.thumbnailUrl ? (
              <iframe
                src={resolveFileUrl(activeSlide.fileUrl)}
                className="w-full h-full rounded-2xl border border-slate-800"
                title={activeSlide.title}
              />
            ) : (
              <img
                src={resolveFileUrl(activeSlide.thumbnailUrl || activeSlide.fileUrl)}
                alt={activeSlide.title}
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}

            {/* Floating Navigation Arrows */}
            {activeSlideIndex !== null && activeSlideIndex > 0 && (
              <button
                onClick={handlePrevSlide}
                className="absolute left-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all"
                title="Previous Slide (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {activeSlideIndex !== null && activeSlideIndex < sortedContents.length - 1 && (
              <button
                onClick={handleNextSlide}
                className="absolute right-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all"
                title="Next Slide (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Clinical Highlights Drawer (Toggleable) */}
            {showKeyPoints && (
              <div className="absolute bottom-4 left-6 right-6 p-4 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Clinical Key Talking Points</span>
                  </div>
                  <button onClick={() => setShowKeyPoints(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {activeSlide.description ||
                    'Highlight superior bioavailability, clinically documented efficacy, and patient compliance for this Biocros formulation.'}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Presenter Controls */}
          <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between z-20">
            {/* Toggle Clinical Notes */}
            <button
              onClick={() => setShowKeyPoints((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                showKeyPoints
                  ? 'bg-emerald-900 border-emerald-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showKeyPoints ? 'Hide Clinical Notes' : 'Clinical Talking Notes'}</span>
            </button>

            {/* Slide Navigation Center */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevSlide}
                disabled={activeSlideIndex === 0}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-400">
                {(activeSlideIndex ?? 0) + 1} of {sortedContents.length}
              </span>

              <button
                onClick={handleNextSlide}
                disabled={activeSlideIndex === sortedContents.length - 1}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Open / External */}
            <a
              href={resolveFileUrl(activeSlide.fileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Asset
            </a>
          </div>
        </div>
      )}

      {/* ── MODAL 1: DETAILING CATEGORY MANAGER ── */}
      <DetailingCategoryManagerModal
        isOpen={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        categories={dynamicCategories}
        allContents={contents}
      />

      {/* ── MODAL 2: DOCTOR DETAILING PLAN & SLIDE SET ── */}
      {doctorContext && (
        <DoctorDetailingPlanModal
          isOpen={detailingPlanModalVisible}
          onClose={() => setDetailingPlanModalVisible(false)}
          doctor={doctorContext}
          allContents={contents}
          categories={dynamicCategories}
          onPlanSaved={(saved) => {
            setDoctorPlan(saved);
            setSpecialtyFilter('MY_PLAN');
          }}
        />
      )}

      {/* ── MODAL 3: DOCTOR PICKER (FOR ADMIN TO SELECT DOCTOR TO CONFIGURE) ── */}
      {showDoctorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Select Doctor to Curate Detailing Slide Deck</h3>
                <p className="text-xs text-slate-500">Pick any doctor to configure their prescribed medicines & slide sequence</p>
              </div>
              <button onClick={() => setShowDoctorPicker(false)} className="p-1.5 rounded-xl hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Search doctor by name, specialty, or code..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                {doctorPickerList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No doctors found matching query
                  </div>
                ) : (
                  doctorPickerList.map((doc: any) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctorForPlan(doc);
                        setShowDoctorPicker(false);
                        setDetailingPlanModalVisible(true);
                      }}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          Dr. {doc.firstName} {doc.lastName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {doc.specialty || doc.category || 'General'} • {doc.city || doc.area?.name || 'Nagpur'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Configure Deck →
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: UPLOAD CONTENT MODAL (ADMIN) ── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-base">Upload Marketing & Detailing Collateral</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-xl hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadMutation.mutate();
              }}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Biospore 4 Clinical Efficacy & MoA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Format Type</label>
                  <select
                    value={form.contentType}
                    onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                  >
                    <option value="PRESENTATION">Visual Aid (Presentation)</option>
                    <option value="IMAGE">Clinical Slide (Image)</option>
                    <option value="VIDEO">MoA Video</option>
                    <option value="ANIMATION">3D Animation</option>
                    <option value="PDF">Product Monograph (PDF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Version</label>
                  <input
                    value={form.version}
                    onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Biocros Product</label>
                <input
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  placeholder="e.g. Biospore 4 Tablet"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {TOP_PRODUCTS.slice(0, 5).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, productName: p }))}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 px-2 py-0.5 rounded-md"
                    >
                      +{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Upload File (PDF, Video, Image)</label>
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                {!uploadFile && (
                  <div className="mt-2">
                    <span className="text-[11px] text-slate-400 block mb-1">Or provide external URL:</span>
                    <input
                      value={form.fileUrl}
                      onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {campaigns.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Campaign</label>
                  <select
                    value={form.campaignId}
                    onChange={(e) => setForm((f) => ({ ...f, campaignId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none"
                  >
                    <option value="">No Campaign (Standard Detailing)</option>
                    {campaigns.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Notes & Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Key therapeutic benefits to highlight during MR presentation..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md disabled:opacity-60"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    'Deploy Collateral'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DigitalDetailingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <DigitalDetailingContent />
    </Suspense>
  );
}
