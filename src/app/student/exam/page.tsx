'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, HelpCircle, LogOut, PlayCircle } from 'lucide-react';
import { Alert, Footer, Header, Spinner, primaryBtn } from '@/components/Shell';
import { errMsg } from '@/lib/utils';

type ExamItem = {
  id: number;
  title: string;
  duration: number;
  questionCount: number;
  status: 'available' | 'in-progress' | 'completed';
  result: { score: number; correct: number; total: number } | null;
};

export default function ExamSelection() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const logout = useCallback(async () => {
    await fetch('/api/student/logout', { method: 'POST' });
    router.push('/student/login');
    router.refresh();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, examsRes] = await Promise.all([fetch('/api/student/me'), fetch('/api/student/exams')]);
        if (meRes.status === 401 || examsRes.status === 401) {
          router.push('/student/login');
          return;
        }
        if (!examsRes.ok) throw new Error((await examsRes.json()).error || 'Error fetching exams');
        const me = await meRes.json();
        setStudentName(me.fullName || me.username);
        setExams(await examsRes.json());
      } catch (err) {
        setError(errMsg(err, 'Failed to connect to the server. Please try again.'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        {studentName && <span className="hidden text-sm text-emerald-50 sm:inline">{studentName}</span>}
        <button onClick={logout} className="flex items-center gap-1.5 text-sm hover:underline">
          <LogOut size={16} /> Logout
        </button>
      </Header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Available Exams</h1>
        <p className="mb-8 mt-1 text-sm text-gray-600">
          Select an exam to begin. The timer starts as soon as you open it and each exam can be taken once.
        </p>

        {isLoading ? (
          <Spinner label="Loading exams..." />
        ) : error ? (
          <Alert kind="error">{error}</Alert>
        ) : exams.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-gray-600 shadow-sm">
            No exams are available at the moment. Please check back later.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div key={exam.id} className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">{exam.title}</h2>
                <div className="mb-5 space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Clock size={16} /> {exam.duration} minutes
                  </p>
                  <p className="flex items-center gap-2">
                    <HelpCircle size={16} /> {exam.questionCount} questions
                  </p>
                </div>
                <div className="mt-auto">
                  {exam.status === 'completed' && exam.result ? (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                      <CheckCircle2 size={18} />
                      Completed: {exam.result.score.toFixed(1)}% ({exam.result.correct}/{exam.result.total})
                    </div>
                  ) : exam.questionCount === 0 ? (
                    <p className="text-sm text-gray-500">No questions yet</p>
                  ) : (
                    <Link href={`/student/exam/${exam.id}`} className={`${primaryBtn} w-full`}>
                      <PlayCircle size={18} />
                      {exam.status === 'in-progress' ? 'Resume Exam' : 'Start Exam'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
