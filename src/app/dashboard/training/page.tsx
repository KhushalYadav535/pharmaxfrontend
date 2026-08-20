'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookOpen, Play, CheckCircle, Clock, Award, ChevronRight, X, Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function TrainingPage() {
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: progress } = useQuery({
    queryKey: ['training-progress'],
    queryFn: () => api.get('/training/my-progress').then((r) => r.data.data),
  });

  const { data: modules, isLoading } = useQuery({
    queryKey: ['training-modules', search],
    queryFn: () => api.get('/training/modules', { params: { search } }).then((r) => r.data.data),
  });

  const attemptMutation = useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: number[] }) =>
      api.post(`/training/modules/${id}/attempt`, { answers }).then((r) => r.data.data),
    onSuccess: (data) => {
      setQuizResult(data);
      qc.invalidateQueries({ queryKey: ['training-modules'] });
      qc.invalidateQueries({ queryKey: ['training-progress'] });
    },
  });

  const openModule = async (module: any) => {
    const { data } = await api.get(`/training/modules/${module.id}`);
    setSelectedModule(data.data);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const submitQuiz = () => {
    if (!selectedModule) return;
    attemptMutation.mutate({ id: selectedModule.id, answers: quizAnswers });
  };

  const CONTENT_TYPE_ICONS: Record<string, string> = {
    PDF: '📄', VIDEO: '🎬', IMAGE: '🖼️', PRESENTATION: '📊', ANIMATION: '✨',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" /> Training
        </h1>
        <p className="text-gray-500 text-sm mt-1">Complete modules and quizzes to upskill your knowledge</p>
      </div>

      {/* Progress banner */}
      {progress && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-lg">Your Progress</p>
              <p className="text-sm text-gray-500">{progress.completed} of {progress.totalModules} modules completed · Avg score: {progress.avgScore}%</p>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span className="text-2xl font-bold text-gray-900">{progress.completionRate}%</span>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all" style={{ width: `${progress.completionRate}%` }} />
          </div>
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{progress.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{progress.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{progress.avgScore}%</p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search training modules..." className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 bg-white shadow-sm" />
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : modules?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No training modules available</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules?.map((module: any) => {
            const latestAttempt = module.attempts?.[0];
            const isPassed = latestAttempt?.passed;
            return (
              <div key={module.id} onClick={() => openModule(module)} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {CONTENT_TYPE_ICONS[module.contentType] || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">{module.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{module.description || 'Complete this module to improve your skills.'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {module.duration && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {module.duration} min
                      </div>
                    )}
                    {module.quizzes?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3.5 h-3.5" />
                        {module.quizzes.length} questions
                      </div>
                    )}
                  </div>
                  {isPassed ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" /> Passed
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Play className="w-3 h-3" /> Start
                    </div>
                  )}
                </div>

                {latestAttempt && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Last score</span>
                      <span className={`font-semibold ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
                        {latestAttempt.score}/{latestAttempt.totalScore}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className={`h-full rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${latestAttempt.totalScore > 0 ? (latestAttempt.score / latestAttempt.totalScore) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Module Detail / Quiz Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{selectedModule.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedModule.quizzes?.length} questions · {selectedModule.duration} min</p>
              </div>
              <button onClick={() => { setSelectedModule(null); setQuizResult(null); }} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>

            <div className="p-6">
              {quizResult ? (
                /* Results Screen */
                <div className="text-center py-8">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${quizResult.passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {quizResult.passed ? <CheckCircle className="w-10 h-10 text-emerald-600" /> : <X className="w-10 h-10 text-red-500" />}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{quizResult.passed ? '🎉 Congratulations!' : 'Keep Practicing!'}</h3>
                  <p className="text-gray-500 mb-4">You scored <span className="font-bold text-gray-900">{quizResult.score}/{quizResult.totalScore}</span> ({Math.round((quizResult.score / Math.max(quizResult.totalScore, 1)) * 100)}%)</p>
                  <p className="text-sm text-gray-500 mb-6">{quizResult.passed ? 'Module marked as completed!' : 'You need 70% to pass. Try again!'}</p>
                  <div className="flex gap-3 justify-center">
                    {!quizResult.passed && (
                      <button onClick={() => { setQuizAnswers([]); setQuizResult(null); }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors">Retry Quiz</button>
                    )}
                    <button onClick={() => { setSelectedModule(null); setQuizResult(null); }} className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors">Close</button>
                  </div>
                </div>
              ) : (
                /* Quiz Questions */
                <>
                  {selectedModule.description && (
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-700">{selectedModule.description}</p>
                      {selectedModule.contentUrl && (
                        <a href={selectedModule.contentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-800">
                          <BookOpen className="w-3.5 h-3.5" /> View Study Material
                        </a>
                      )}
                    </div>
                  )}

                  {selectedModule.quizzes?.length > 0 ? (
                    <div className="space-y-6">
                      <p className="text-sm font-semibold text-gray-900">Answer all questions to complete the module:</p>
                      {selectedModule.quizzes.map((quiz: any, qi: number) => (
                        <div key={quiz.id} className="border border-gray-100 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-900 mb-3">{qi + 1}. {quiz.question}</p>
                          <div className="space-y-2">
                            {quiz.options.map((option: string, oi: number) => (
                              <button
                                key={oi}
                                onClick={() => {
                                  const answers = [...quizAnswers];
                                  answers[qi] = oi;
                                  setQuizAnswers(answers);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all ${
                                  quizAnswers[qi] === oi
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-medium'
                                    : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span> {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={submitQuiz}
                        disabled={quizAnswers.length < selectedModule.quizzes.length || quizAnswers.some((a) => a === undefined) || attemptMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
                      >
                        {attemptMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Quiz'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">This module has no quiz. Mark it as read to complete.</p>
                      <button
                        onClick={() => attemptMutation.mutate({ id: selectedModule.id, answers: [] })}
                        disabled={attemptMutation.isPending}
                        className="mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 text-sm mx-auto"
                      >
                        {attemptMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Completing...</> : <><CheckCircle className="w-4 h-4" /> Mark as Complete</>}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
