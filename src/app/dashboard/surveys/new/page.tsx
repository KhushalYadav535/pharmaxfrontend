import React from 'react';
import SurveyForm from '@/components/surveys/SurveyForm';

export const metadata = {
  title: 'New Survey | Pharmax',
};

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Survey</h1>
        <p className="text-gray-500">Fill out the details below to submit.</p>
      </div>
      <SurveyForm />
    </div>
  );
}
