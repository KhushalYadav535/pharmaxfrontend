import { Suspense } from 'react';
import DoctorForm from '@/components/doctors/DoctorForm';
import { Loader2 } from 'lucide-react';

export default function NewDoctorPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-semibold">Loading Doctor Form...</p>
          </div>
        }
      >
        <DoctorForm />
      </Suspense>
    </div>
  );
}
