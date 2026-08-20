'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, Video, Image, Play, Eye, Search, Filter, Lock, Unlock, Plus, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';

const TYPE_ICONS: Record<string, any> = {
  PDF: FileText,
  VIDEO: Video,
  IMAGE: Image,
  PRESENTATION: FileText,
  ANIMATION: Play,
};

const TYPE_COLORS: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  VIDEO: 'bg-blue-50 text-blue-600',
  IMAGE: 'bg-purple-50 text-purple-600',
  PRESENTATION: 'bg-amber-50 text-amber-600',
  ANIMATION: 'bg-emerald-50 text-emerald-600',
};

const CONTENT_TYPES = ['PDF', 'VIDEO', 'IMAGE', 'PRESENTATION', 'ANIMATION'];

export default function DigitalDetailingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isManager = ['ASM','RSM','ZM','NSM','SUPER_ADMIN','SALES_ADMIN','PRODUCT_MANAGER','MARKETING'].includes(user?.role || '');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', contentType: 'PDF', fileUrl: '', productName: '', campaignId: '' });

  const { data: contents, isLoading } = useQuery({
    queryKey: ['contents', search, typeFilter, selectedCampaign],
    queryFn: () => api.get('/content', { params: { search: search || undefined, type: typeFilter || undefined, campaignId: selectedCampaign || undefined } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/content/campaigns/list').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/content', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contents'] }); setShowAddForm(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/content/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contents'] }),
  });

  const openPreview = async (content: any) => {
    await api.get(`/content/${content.id}`);
    setPreviewContent(content);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Play className="w-6 h-6 text-emerald-600" /> Digital Detailing
          </h1>
          <p className="text-gray-500 text-sm mt-1">Access product presentations, videos, and clinical studies</p>
        </div>
        {isManager && (
          <button onClick={() => setShowAddForm(true)} id="add-content-btn" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Upload Content
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', ...CONTENT_TYPES].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${typeFilter === t ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-200'}`}>
                {t || 'All'}
              </button>
            ))}
          </div>
          {campaigns && campaigns.length > 0 && (
            <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Campaigns</option>
              {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : contents?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No content found</p>
          {isManager && <button onClick={() => setShowAddForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Upload first content →</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contents?.map((content: any) => {
            const Icon = TYPE_ICONS[content.contentType] || FileText;
            return (
              <div key={content.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden ${content.isDisabled ? 'opacity-60' : ''}`}>
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 relative flex items-center justify-center">
                  {content.thumbnailUrl ? (
                    <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${TYPE_COLORS[content.contentType] || 'bg-gray-100 text-gray-400'}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                  )}
                  <button onClick={() => openPreview(content)} className="absolute inset-0 bg-black/0 hover:bg-black/20 group-hover:flex hidden items-center justify-center transition-all">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      {content.contentType === 'VIDEO' ? <Play className="w-5 h-5 text-gray-800 ml-0.5" /> : <Eye className="w-5 h-5 text-gray-800" />}
                    </div>
                  </button>
                  {content.isDisabled && <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-lg font-medium">Disabled</div>}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{content.title}</h3>
                      {content.productName && <p className="text-xs text-emerald-600 font-medium mt-0.5">{content.productName}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0 ${TYPE_COLORS[content.contentType] || 'bg-gray-100 text-gray-500'}`}>{content.contentType}</span>
                  </div>
                  {content.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{content.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span>{content._count?.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openPreview(content)} className="text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors">Open</button>
                      {isManager && (
                        <button onClick={() => toggleMutation.mutate(content.id)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors" title={content.isDisabled ? 'Enable' : 'Disable'}>
                          {content.isDisabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewContent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">{previewContent.title}</h3>
                {previewContent.productName && <p className="text-sm text-emerald-600">{previewContent.productName}</p>}
              </div>
              <button onClick={() => setPreviewContent(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              {previewContent.contentType === 'VIDEO' ? (
                <video src={previewContent.fileUrl} controls className="w-full rounded-xl max-h-96 bg-black" />
              ) : previewContent.contentType === 'IMAGE' ? (
                <img src={previewContent.fileUrl} alt={previewContent.title} className="w-full rounded-xl max-h-96 object-contain" />
              ) : previewContent.contentType === 'PDF' ? (
                <iframe src={previewContent.fileUrl} className="w-full h-96 rounded-xl border border-gray-200" title={previewContent.title} />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">{previewContent.description}</p>
                  <a href={previewContent.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                    <Play className="w-4 h-4" /> Open {previewContent.contentType}
                  </a>
                </div>
              )}
              {previewContent.campaign && (
                <p className="text-xs text-gray-400 mt-3">Campaign: {previewContent.campaign.name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Content Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Upload Content</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, isActive: true }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.contentType} onChange={(e) => setForm(f => ({ ...f, contentType: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                  <input value={form.productName} onChange={(e) => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="e.g. Atorvastatin" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">File URL *</label>
                <input required value={form.fileUrl} onChange={(e) => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              {campaigns && campaigns.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campaign</label>
                  <select value={form.campaignId} onChange={(e) => setForm(f => ({ ...f, campaignId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">No campaign</option>
                    {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
