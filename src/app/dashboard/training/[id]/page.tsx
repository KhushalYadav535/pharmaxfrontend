'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  BookOpen, CheckCircle2, XCircle, ArrowLeft, Award,
  Trophy, Clock, Star, ArrowRight, ExternalLink,
  Sparkles, Check, AlertCircle, RefreshCw, Layers,
  Play, FileText, Video, Zap, CheckCircle
} from 'lucide-react';

export default function TrainingModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);

  const { data: moduleData, isLoading } = useQuery({
    queryKey: ['training-module-detail', id],
    queryFn: () => api.get(`/training/modules/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const attemptMutation = useMutation({
    mutationFn: (answers: number[]) =>
      api.post(`/training/modules/${id}/attempt`, { answers }).then((r) => r.data.data),
    onSuccess: (data) => {
      setQuizResult(data);
      qc.invalidateQueries({ queryKey: ['training-module-detail', id] });
      qc.invalidateQueries({ queryKey: ['training-modules'] });
      qc.invalidateQueries({ queryKey: ['training-progress'] });
    },
  });

  const submitQuiz = () => {
    if (!moduleData) return;
    attemptMutation.mutate(quizAnswers);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Training Module Not Found</h2>
        <p className="text-xs text-slate-500">The requested learning course could not be retrieved.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
        >
          Back to Academy
        </button>
      </div>
    );
  }

  const quizzes = moduleData.quizzes || [];
  const answeredCount = quizAnswers.filter((a) => a !== undefined).length;
  const isAllAnswered = quizzes.length > 0 && answeredCount === quizzes.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Field Academy
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Passing Score: <strong>{moduleData.passingScore || 80}%</strong>
          </span>
        </div>
      </div>

      {/* ── MODULE HEADER ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 border border-purple-100 shadow-2xs">
              <BookOpen className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {moduleData.title}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                  {moduleData.contentType || 'Clinical Training'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {moduleData.description || 'Master clinical pharmacology, key indications, objections handling, and detailing scripts.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-black text-slate-900">{moduleData.durationMinutes || 15} mins</span>
            </div>
          </div>
        </div>

        {/* Study Material Link */}
        {moduleData.contentUrl && (
          <div className="pt-2">
            <a
              href={moduleData.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-2xl border border-purple-200 transition-colors shadow-2xs"
            >
              <Play className="w-4 h-4 fill-purple-700 text-purple-700" />
              <span>Launch Clinical Study Material & Presentation</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        )}
      </div>

      {/* ── QUIZ EVALUATION SECTION ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Module Knowledge Assessment</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {quizzes.length} Question{quizzes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Result banner if quiz completed */}
        {quizResult && (
          <div
            className={`p-5 rounded-2xl border ${
              quizResult.passed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {quizResult.passed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-black text-base">
                  {quizResult.passed ? 'Assessment Passed! Congratulations!' : 'Assessment Not Passed'}
                </p>
                <p className="text-xs mt-0.5">
                  You scored <strong>{quizResult.score}%</strong> (Passing requirement: {moduleData.passingScore || 80}%).
                  {quizResult.passed ? ' Your certification badge has been added to your profile.' : ' Review the study material and attempt the quiz again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quiz questions */}
        {quizzes.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-xs font-semibold">No quiz required for this module. Review the material above to complete.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {quizzes.map((quiz: any, qIdx: number) => {
              const selectedOpt = quizAnswers[qIdx];
              return (
                <div key={quiz.id || qIdx} className="space-y-3 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-900">
                    <span className="text-emerald-700 font-black mr-1">Q{qIdx + 1}.</span> {quiz.question}
                  </p>

                  <div className="space-y-2">
                    {quiz.options?.map((opt: string, optIdx: number) => {
                      const isChosen = selectedOpt === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            if (quizResult?.passed) return;
                            const next = [...quizAnswers];
                            next[qIdx] = optIdx;
                            setQuizAnswers(next);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                            isChosen
                              ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {isChosen && (
                            <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Submit Quiz Button */}
            {!quizResult?.passed && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={submitQuiz}
                  disabled={!isAllAnswered || attemptMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all"
                >
                  {attemptMutation.isPending ? 'Grading Answers...' : 'Submit Answers for Certification'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
