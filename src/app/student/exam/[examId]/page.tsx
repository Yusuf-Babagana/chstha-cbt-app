'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react';
import { Alert, Footer, Header, Spinner, primaryBtn } from '@/components/Shell';
import { errMsg } from '@/lib/utils';

type Question = { id: number; text: string; options: string[] };
type Result = { score: number; correct: number; total: number };

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const answersRef = useRef<number[]>([]);
  const endAtRef = useRef(0);
  const submittingRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = result !== null;

  // Start or resume the attempt.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/student/exams/${examId}/start`, { method: 'POST' });
        if (res.status === 401) return router.push('/student/login');
        const data = await res.json();
        if (res.status === 409 && data.alreadyTaken) {
          setError('You have already taken this exam.');
          setResult(data.result);
          setTitle('');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Error starting exam');
        setTitle(data.title);
        if (data.finished) {
          setAutoSubmitted(true);
          setResult(data.result);
          return;
        }
        setQuestions(data.questions);
        setAnswers(data.answers);
        answersRef.current = data.answers;
        endAtRef.current = Date.now() + data.remainingSeconds * 1000;
        setTimeLeft(data.remainingSeconds);
      } catch (err) {
        setError(errMsg(err, 'Failed to connect to the server. Please try again.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, router]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setError('');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      try {
        const res = await fetch(`/api/student/exams/${examId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answersRef.current }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Error submitting exam');
        setAutoSubmitted(auto);
        setResult(data.result);
      } catch (err) {
        setError(`${errMsg(err, 'Could not submit.')} Your answers are saved - please try submitting again.`);
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [examId]
  );

  // Countdown based on an absolute end time, so it stays accurate if the tab is throttled.
  useEffect(() => {
    if (timeLeft === null || finished) return;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(tick);
        submit(true);
      }
    }, 500);
    return () => clearInterval(tick);
  }, [timeLeft === null, finished, submit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before leaving mid-exam.
  useEffect(() => {
    if (finished || questions.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [finished, questions.length]);

  const selectAnswer = (index: number, option: number) => {
    const next = [...answersRef.current];
    next[index] = option;
    answersRef.current = next;
    setAnswers(next);
    // Debounced autosave so a refresh or crash keeps progress.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/student/exams/${examId}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current }),
      }).catch(() => {});
    }, 600);
  };

  const confirmSubmit = () => {
    const unanswered = answers.filter((a) => a < 0).length;
    const msg = unanswered
      ? `You have ${unanswered} unanswered question(s). Submit anyway?`
      : 'Submit your exam now? You cannot change your answers afterwards.';
    if (window.confirm(msg)) submit(false);
  };

  const logout = async () => {
    if (!finished && !window.confirm('Your exam timer keeps running while you are logged out. Log out anyway?')) return;
    await fetch('/api/student/logout', { method: 'POST' });
    router.push('/student/login');
    router.refresh();
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col">
      <Header>
        <button onClick={logout} className="text-sm hover:underline">
          Logout
        </button>
      </Header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );

  if (loading) return shell(<Spinner label="Loading exam..." />);

  if (finished && result) {
    const pass = result.score >= 50;
    return shell(
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto mb-3 text-emerald-600" size={48} />
        <h1 className="text-2xl font-bold text-gray-900">{error ? 'Exam already completed' : 'Exam submitted'}</h1>
        {title && <p className="mt-1 text-gray-600">{title}</p>}
        {autoSubmitted && !error && <p className="mt-3 text-sm text-amber-700">Time ran out, so your saved answers were submitted automatically.</p>}
        <div className={`mt-6 text-5xl font-bold ${pass ? 'text-emerald-700' : 'text-red-600'}`}>{result.score.toFixed(1)}%</div>
        <p className="mt-2 text-gray-600">
          {result.correct} of {result.total} questions correct
        </p>
        <Link href="/student/exam" className={`${primaryBtn} mt-8`}>
          Back to exams
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return shell(
      <div className="space-y-4">
        <Alert kind="error">{error || 'This exam is not available.'}</Alert>
        <Link href="/student/exam" className="text-emerald-700 hover:underline">
          &larr; Back to exams
        </Link>
      </div>
    );
  }

  const q = questions[current];
  const lowTime = (timeLeft ?? 0) <= 60;
  const answeredCount = answers.filter((a) => a >= 0).length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-emerald-800 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen size={20} className="shrink-0" />
            <h1 className="truncate font-semibold">{title}</h1>
          </div>
          <div
            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-mono text-lg font-semibold ${
              lowTime ? 'animate-pulse bg-red-600' : 'bg-emerald-900'
            }`}
            aria-label="Time remaining"
          >
            <Clock size={18} /> {formatTime(timeLeft ?? 0)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_260px]">
        <section>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-medium text-emerald-700">
              Question {current + 1} of {questions.length}
            </p>
            <h2 className="mb-5 whitespace-pre-wrap text-lg font-medium text-gray-900">{q.text}</h2>
            <div className="space-y-3" role="radiogroup">
              {q.options.map((option, i) => {
                const selected = answers[current] === i;
                return (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                      selected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={selected}
                      onChange={() => selectAnswer(current, i)}
                      disabled={submitting}
                      className="mt-1 h-4 w-4 accent-emerald-700"
                    />
                    <span className="text-gray-800">
                      <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-4">
              <Alert kind="error">{error}</Alert>
            </div>
          )}

          <div className="mt-5 flex justify-between gap-3">
            <button
              onClick={() => setCurrent((c) => c - 1)}
              disabled={current === 0 || submitting}
              className={primaryBtn}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            {current === questions.length - 1 ? (
              <button onClick={confirmSubmit} disabled={submitting} className={`${primaryBtn} !bg-amber-600 hover:!bg-amber-700`}>
                <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button onClick={() => setCurrent((c) => c + 1)} disabled={submitting} className={primaryBtn}>
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-xl bg-white p-4 shadow-sm lg:sticky lg:top-20">
          <h3 className="mb-1 font-semibold text-gray-900">Question navigator</h3>
          <p className="mb-3 text-xs text-gray-500">
            {answeredCount} of {questions.length} answered
          </p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to question ${i + 1}`}
                className={`h-9 rounded text-sm font-medium ${
                  i === current
                    ? 'bg-emerald-700 text-white'
                    : answers[i] >= 0
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={confirmSubmit} disabled={submitting} className={`${primaryBtn} mt-4 w-full`}>
            <Send size={16} /> Finish &amp; Submit
          </button>
        </aside>
      </main>
    </div>
  );
}
