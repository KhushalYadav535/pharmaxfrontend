'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import VisitReportForm from '@/components/visits/VisitReportForm';
import { Loader2 } from 'lucide-react';

export default function VisitReportPage() {
  const params = useParams();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVisit() {
      try {
        const res = await api.get(`/visits/${params.id}`);
        setVisit(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      loadVisit();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
        Visit not found.
      </div>
    );
  }

  return <VisitReportForm visit={visit} />;
}
