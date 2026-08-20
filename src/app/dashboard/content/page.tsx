'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Megaphone, Plus, X, Loader2, FileText, Video, Image, Presentation, Eye, ToggleLeft, ToggleRight, Search, Filter, Zap, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const isManager = (role: string) => ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'MARKETING', 'PRODUCT_MANAGER'].includes(role);

const TYPE_ICONS: Record<string, any> = {
  PDF: FileText, VIDEO: Video, IMAGE: Image, PRESENTATION: Presentation, ANIMATION: Zap,
};
const TYPE_COLORS: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600 border-red-100',
  VIDEO: 'bg-blue-50 text-blue-600 border-blue-100',
  IMAGE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  PRESENTATION: 'bg-purple-50 text-purple-600 border-purple-100',
  ANIMATION: 'bg-amber-50 text-amber-600 border-amber-100',
};

const CONTENT_TYPES = ['PDF', 'VIDEO', 'IMAGE', 'PRESENTATION', 'ANIMATION'];

const EMPTY_CONTENT = { title: '', description: '', contentType: 'PDF', fileUrl: '', thumbnailUrl: '', productName: '', campaignId: '', version: '1.0' };
const EMPTY_CAMPAIGN = { name: '', description: '', startDate: '', endDate: '' };

export default function ContentPage() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'content' | 'campaigns'>('content');
  const [showContentForm, setShowContentForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [contentForm, setContentForm] = useState({ ...EMPTY_CONTENT });
  const [campaignForm, setCampaignForm] = useState({ ...EMPTY_CAMPAIGN });
  const qc = useQueryClient();

  const { data: contents, isLoading } = useQuery({
    queryKey: ['contents', typeFilter, campaignFilter, search],
    queryFn: () => api.get('/content', { params: { type: typeFilter || undefined, campaignId: campaignFilter || undefined, search: search || undefined } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/content/campaigns/list').then((r) => r.data.data),
  });

  const createContent = useMutation({
    mutationFn: (body: any) => api.post('/content', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contents'] }); setShowContentForm(false); setContentForm({ ...EMPTY_CONTENT }); },
  });

  const createCampaign = useMutation({
    mutationFn: (body: any) => api.post('/content/campaigns', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowCampaignForm(false); setCampaignForm({ ...EMPTY_CAMPAIGN }); },
  });

  const toggleContent = useMutation({
    mutationFn: (id: string) => api.patch(`/content/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contents'] }),
  });

  const logView = useMutation({
    mutationFn: (id: string) => api.get(`/content/${id}`),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-600" /> Content Library
          </h1>
          <p className="text-gray-500 text-sm mt-1">Digital detailing materials, campaigns & product content</p>
        </div>
        {isManager(user?.role || '') && (
          <div className="flex gap-2">
            <button onClick={() => setShowCampaignForm(true)} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 transition-colors">
              <Megaphone className="w-4 h-4" /> New Campaign
            </button>
            <button onClick={() => setShowContentForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Content
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1 shadow-sm w-fit">
        {[{ key: 'content', label: 'Content Library' }, { key: 'campaigns', label: 'Campaigns' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
              <option value="">All Types</option>
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
              <option value="">All Campaigns</option>
              {campaigns?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : contents?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Megaphone className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No content found</p>
              {isManager(user?.role || '') && (
                <button onClick={() => setShowContentForm(true)} className="mt-3 text-emerald-600 text-sm font-medium">Add content →</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contents?.map((c: any) => {
                const Icon = TYPE_ICONS[c.contentType] || FileText;
                const colorClass = TYPE_COLORS[c.contentType] || 'bg-gray-50 text-gray-500 border-gray-100';
                return (
                  <div key={c.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all ${c.isDisabled ? 'opacity-50' : ''}`}>
                    <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                      {c.thumbnailUrl ? (
                        <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${colorClass}`}>
                          <Icon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${colorClass}`}>{c.contentType}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-white/80 text-gray-600">v{c.version}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{c.productName || c.campaign?.name || 'General'}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Eye className="w-3 h-3" />
                          <span>{c._count?.views ?? 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {c.fileUrl && (
                            <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" onClick={() => logView.mutate(c.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Eye className="w-3 h-3" /> View
                            </a>
                          )}
                          {isManager(user?.role || '') && (
                            <button onClick={() => toggleContent.mutate(c.id)} title={c.isDisabled ? 'Enable' : 'Disable'} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                              {c.isDisabled ? <ToggleLeft className="w-4 h-4 text-red-400" /> : <ToggleRight className="w-4 h-4 text-emerald-500" />}
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
        </>
      )}

      {tab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns?.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-24 text-gray-400">
              <Megaphone className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No campaigns yet</p>
            </div>
          ) : campaigns?.map((campaign: any) => {
            const now = new Date();
            const end = campaign.endDate ? new Date(campaign.endDate) : null;
            const isActive = campaign.isActive && (!end || end > now);
            return (
              <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isActive ? 'Active' : 'Ended'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{campaign.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <FileText className="w-3 h-3" />
                    <span>{campaign._count?.contents ?? 0} pieces</span>
                  </div>
                  {campaign.endDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Ends {formatDate(campaign.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Content Modal */}
      {showContentForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Add New Content</h2>
              <button onClick={() => setShowContentForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createContent.mutate(contentForm); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input required value={contentForm.title} onChange={(e) => setContentForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Amoxil MOA Animation" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content Type *</label>
                  <select required value={contentForm.contentType} onChange={(e) => setContentForm(f => ({ ...f, contentType: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
                    {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Version</label>
                  <input value={contentForm.version} onChange={(e) => setContentForm(f => ({ ...f, version: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="1.0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">File URL *</label>
                <input required value={contentForm.fileUrl} onChange={(e) => setContentForm(f => ({ ...f, fileUrl: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                <input value={contentForm.productName} onChange={(e) => setContentForm(f => ({ ...f, productName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Associated product" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Campaign</label>
                <select value={contentForm.campaignId} onChange={(e) => setContentForm(f => ({ ...f, campaignId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
                  <option value="">No campaign</option>
                  {campaigns?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={contentForm.description} onChange={(e) => setContentForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowContentForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createContent.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createContent.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Add Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Create Campaign</h2>
              <button onClick={() => setShowCampaignForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createCampaign.mutate(campaignForm); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input required value={campaignForm.name} onChange={(e) => setCampaignForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Q2 Product Launch" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={campaignForm.description} onChange={(e) => setCampaignForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={campaignForm.startDate} onChange={(e) => setCampaignForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={campaignForm.endDate} onChange={(e) => setCampaignForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCampaignForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createCampaign.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createCampaign.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
