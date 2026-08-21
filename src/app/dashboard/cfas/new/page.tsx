import React from 'react';
import CfaForm from '@/components/cfas/CfaForm';

export const metadata = {
  title: 'Add CFA | Pharmax',
};

export default function NewCfaPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <CfaForm />
    </div>
  );
}
