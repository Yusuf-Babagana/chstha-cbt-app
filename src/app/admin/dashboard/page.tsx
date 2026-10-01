'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, KeyRound, LogOut, RotateCcw, Trash2, Users } from 'lucide-react';
import { Alert, Footer, Header, Spinner, dangerBtn, inputClass, primaryBtn } from '@/components/Shell';
import { errMsg } from '@/lib/utils';

type Student = { id: number; username: string; fullName: string | null; createdAt: string; _count: { scores: number } };
type Exam = { id: number; title: string; duration: number; createdAt: string; _count: { questions: number; scores: number } };
type Question = { id: number; text: string; options: string[]; correct: number };
type Score = {
  id: number;
  score: number;
  correct: number;
  total: number;
  createdAt: string;
  student: { username: string; fullName: string | null };
  exam: { title: string };
};
type Notice = { kind: 'error' | 'success'; text: string } | null;

const tabs = [
  { id: 'students', label: 'Students', icon: Users },
  { id: 'exams', label: 'Exams', icon: FileText },
  { id: 'scores', label: 'Scores', icon: Download },
] as const;
type TabId = (typeof tabs)[number]['id'];

/** fetch wrapper that sends the user back to login when the admin session has expired. */
function useApi() {
  const router = useRouter();
  return useCallback(
    async (url: string, init?: RequestInit) => {
      const res = await fetch(url, init);
      if (res.status === 401) {
        router.push('/admin/login');
        throw new Error('Your session has expired. Please log in again.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    },
    [router]
  );
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const fmtDate = (d: string) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</th>
);
const Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2.5 text-sm text-gray-800 ${className}`}>{children}</td>
);

/* ------------------------------ Students ------------------------------ */

function StudentsTab({ notify }: { notify: (n: Notice) => void }) {
  const api = useApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '' });
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkKey, setBulkKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setStudents(await api('/api/student'));
    } catch (e) {
      notify({ kind: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    notify(null);
    try {
      await fn();
    } catch (e) {
      notify({ kind: 'error', text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  const register = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const data = await api('/api/student', jsonInit('POST', form));
      notify({ kind: 'success', text: data.message });
      setForm({ username: '', password: '', fullName: '' });
      await load();
    });
  };

  const bulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    run(async () => {
      const fd = new FormData();
      fd.append('students', bulkFile);
      const data = await api('/api/student/bulk', { method: 'POST', body: fd });
      const skipped = data.details?.length
        ? ` Skipped: ${data.details.slice(0, 5).map((d: { row: number; message: string }) => `row ${d.row} (${d.message})`).join('; ')}`
        : '';
      notify({ kind: 'success', text: data.message + skipped });
      setBulkFile(null);
      setBulkKey((k) => k + 1);
      await load();
    });
  };

  const remove = (s: Student) => {
    if (!window.confirm(`Delete ${s.username}? Their scores will be deleted too.`)) return;
    run(async () => {
      await api('/api/student', jsonInit('DELETE', { username: s.username }));
      notify({ kind: 'success', text: `${s.username} deleted.` });
      await load();
    });
  };

  const resetPassword = (s: Student) => {
    const password = window.prompt(`New password for ${s.username}:`);
    if (!password?.trim()) return;
    run(async () => {
      await api('/api/student', jsonInit('PATCH', { username: s.username, password }));
      notify({ kind: 'success', text: `Password for ${s.username} updated.` });
    });
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? students.filter((s) => s.username.toLowerCase().includes(q) || (s.fullName ?? '').toLowerCase().includes(q)) : students;
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Register a student">
          <form onSubmit={register} className="space-y-4">
            <Field label="Username / Registration No.">
              <input className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </Field>
            <Field label="Password">
              <input className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
            <Field label="Full name (optional)">
              <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <button className={primaryBtn} disabled={busy}>
              Register student
            </button>
          </form>
        </Card>

        <Card title="Bulk register (CSV)">
          <form onSubmit={bulkUpload} className="space-y-4">
            <p className="text-sm text-gray-600">
              Columns: <code className="rounded bg-gray-100 px-1">username</code>, <code className="rounded bg-gray-100 px-1">password</code>,{' '}
              <code className="rounded bg-gray-100 px-1">fullName</code> (optional). Existing usernames get their password updated.{' '}
              <a href="/sample-students.csv" download className="text-emerald-700 underline">
                Download sample
              </a>
            </p>
            <input
              key={bulkKey}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-800"
            />
            <button className={primaryBtn} disabled={busy || !bulkFile}>
              {busy ? 'Uploading...' : 'Upload students'}
            </button>
          </form>
        </Card>
      </div>

      <Card
        title={`Students (${students.length})`}
        action={<input className={`${inputClass} !mt-0 max-w-xs`} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />}
      >
        {loading ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <Th>Username</Th>
                  <Th>Full name</Th>
                  <Th>Exams taken</Th>
                  <Th>Registered</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-medium">{s.username}</Td>
                    <Td>{s.fullName || '-'}</Td>
                    <Td>{s._count.scores}</Td>
                    <Td>{fmtDate(s.createdAt)}</Td>
                    <Td className="space-x-2 whitespace-nowrap text-right">
                      <button onClick={() => resetPassword(s)} disabled={busy} className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
                        <KeyRound size={14} /> Reset password
                      </button>
                      <button onClick={() => remove(s)} disabled={busy} className={dangerBtn}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------- Exams ------------------------------- */

function ExamsTab({ notify }: { notify: (n: Notice) => void }) {
  const api = useApi();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [openExam, setOpenExam] = useState<{ id: number; title: string; questions: Question[] } | null>(null);

  const load = useCallback(async () => {
    try {
      setExams(await api('/api/exams'));
    } catch (e) {
      notify({ kind: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    notify(null);
    try {
      await fn();
    } catch (e) {
      notify({ kind: 'error', text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    run(async () => {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('duration', duration);
      fd.append('questions', file);
      const data = await api('/api/exams', { method: 'POST', body: fd });
      notify({ kind: 'success', text: `${data.exam.title} created with ${data.exam._count.questions} questions.` });
      setTitle('');
      setFile(null);
      setFileKey((k) => k + 1);
      await load();
    });
  };

  const view = (exam: Exam) =>
    run(async () => {
      const data = await api(`/api/exams/${exam.id}`);
      setOpenExam({ id: exam.id, title: exam.title, questions: data.questions });
    });

  const removeExam = (exam: Exam) => {
    if (!window.confirm(`Delete "${exam.title}" with all its questions and ${exam._count.scores} score(s)? This cannot be undone.`)) return;
    run(async () => {
      await api(`/api/exams/${exam.id}`, { method: 'DELETE' });
      notify({ kind: 'success', text: `"${exam.title}" deleted.` });
      if (openExam?.id === exam.id) setOpenExam(null);
      await load();
    });
  };

  const removeQuestion = (q: Question) => {
    if (!window.confirm('Delete this question?')) return;
    run(async () => {
      await api(`/api/questions/${q.id}`, { method: 'DELETE' });
      setOpenExam((o) => (o ? { ...o, questions: o.questions.filter((x) => x.id !== q.id) } : o));
      await load();
    });
  };

  return (
    <div className="space-y-6">
      <Card title="Create an exam">
        <form onSubmit={create} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Field label="Exam title">
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} max={600} className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </Field>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Questions file (CSV)</p>
            <p className="mb-2 text-sm text-gray-600">
              Columns: <code className="rounded bg-gray-100 px-1">text</code>, <code className="rounded bg-gray-100 px-1">option1</code> ...{' '}
              <code className="rounded bg-gray-100 px-1">option4</code> (up to 6), <code className="rounded bg-gray-100 px-1">correct</code>. The{' '}
              <code className="rounded bg-gray-100 px-1">correct</code> value is the <strong>zero-based</strong> position of the right option (0 = option1, 1 = option2, ...).{' '}
              <a href="/sample-questions.csv" download className="text-emerald-700 underline">
                Download sample
              </a>
            </p>
            <input
              key={fileKey}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-800"
              required
            />
          </div>
          <button className={primaryBtn} disabled={busy || !file}>
            {busy ? 'Working...' : 'Create exam'}
          </button>
        </form>
      </Card>

      <Card title={`Exams (${exams.length})`}>
        {loading ? (
          <Spinner />
        ) : exams.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No exams yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Duration</Th>
                  <Th>Questions</Th>
                  <Th>Submissions</Th>
                  <Th>Created</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((x) => (
                  <tr key={x.id}>
                    <Td className="font-medium">{x.title}</Td>
                    <Td>{x.duration} min</Td>
                    <Td>{x._count.questions}</Td>
                    <Td>{x._count.scores}</Td>
                    <Td>{fmtDate(x.createdAt)}</Td>
                    <Td className="space-x-2 whitespace-nowrap text-right">
                      <button onClick={() => view(x)} disabled={busy} className="text-sm text-emerald-700 hover:underline">
                        View questions
                      </button>
                      <button onClick={() => removeExam(x)} disabled={busy} className={dangerBtn}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {openExam && (
        <Card
          title={`Questions: ${openExam.title} (${openExam.questions.length})`}
          action={
            <button onClick={() => setOpenExam(null)} className="text-sm text-gray-500 hover:underline">
              Close
            </button>
          }
        >
          <ol className="space-y-4">
            {openExam.questions.map((q, i) => (
              <li key={q.id} className="rounded-md border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900">
                    {i + 1}. {q.text}
                  </p>
                  <button onClick={() => removeQuestion(q)} disabled={busy} className={dangerBtn}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((o, j) => (
                    <li key={j} className={j === q.correct ? 'font-semibold text-emerald-700' : 'text-gray-600'}>
                      {String.fromCharCode(65 + j)}. {o} {j === q.correct && '(correct)'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- Scores ------------------------------- */

function ScoresTab({ notify }: { notify: (n: Notice) => void }) {
  const api = useApi();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setScores(await api('/api/scores'));
    } catch (e) {
      notify({ kind: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const examTitles = useMemo(() => Array.from(new Set(scores.map((s) => s.exam.title))).sort(), [scores]);
  const shown = examFilter ? scores.filter((s) => s.exam.title === examFilter) : scores;

  const allowRetake = async (s: Score) => {
    if (!window.confirm(`Remove ${s.student.username}'s score for "${s.exam.title}" so they can retake it?`)) return;
    setBusy(true);
    notify(null);
    try {
      const data = await api(`/api/scores/${s.id}`, { method: 'DELETE' });
      notify({ kind: 'success', text: data.message });
      await load();
    } catch (e) {
      notify({ kind: 'error', text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={`Scores (${shown.length})`}
      action={
        <div className="flex flex-wrap items-center gap-3">
          <select className={`${inputClass} !mt-0 max-w-[14rem]`} value={examFilter} onChange={(e) => setExamFilter(e.target.value)} aria-label="Filter by exam">
            <option value="">All exams</option>
            {examTitles.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/scores/download" className={primaryBtn}>
            <Download size={16} /> Download CSV
          </a>
        </div>
      }
    >
      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No scores recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Name</Th>
                <Th>Exam</Th>
                <Th>Correct</Th>
                <Th>Score</Th>
                <Th>Date</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((s) => (
                <tr key={s.id}>
                  <Td className="font-medium">{s.student.username}</Td>
                  <Td>{s.student.fullName || '-'}</Td>
                  <Td>{s.exam.title}</Td>
                  <Td>
                    {s.correct}/{s.total}
                  </Td>
                  <Td className={`font-semibold ${s.score >= 50 ? 'text-emerald-700' : 'text-red-600'}`}>{s.score.toFixed(1)}%</Td>
                  <Td>{fmtDate(s.createdAt)}</Td>
                  <Td className="text-right">
                    <button onClick={() => allowRetake(s)} disabled={busy} className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
                      <RotateCcw size={14} /> Allow retake
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Dashboard ------------------------------ */

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('students');
  const [notice, setNotice] = useState<Notice>(null);

  const switchTab = (id: TabId) => {
    setNotice(null);
    setTab(id);
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        <span className="hidden text-sm text-emerald-50 sm:inline">Administrator</span>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm hover:underline">
          <LogOut size={16} /> Logout
        </button>
      </Header>

      <div className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4" aria-label="Admin sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                tab === id ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-6">
        {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}
        {tab === 'students' && <StudentsTab notify={setNotice} />}
        {tab === 'exams' && <ExamsTab notify={setNotice} />}
        {tab === 'scores' && <ScoresTab notify={setNotice} />}
      </main>
      <Footer />
    </div>
  );
}
