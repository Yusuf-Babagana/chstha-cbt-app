import Link from 'next/link';
import { ClipboardCheck, GraduationCap, ShieldCheck, Timer } from 'lucide-react';
import { Footer, Header, Logo } from '@/components/Shell';
import { COLLEGE_NAME } from '@/lib/brand';

const features = [
  {
    icon: Timer,
    title: 'Timed examinations',
    text: 'A server-synchronised countdown keeps every candidate on the same clock, even after a refresh.',
  },
  {
    icon: ClipboardCheck,
    title: 'Instant results',
    text: 'Objective questions are marked automatically and scores are available the moment an exam ends.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure and fair',
    text: 'Questions are shuffled per candidate and the answer key never leaves the server.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/student/login" className="hover:underline">
            Student Login
          </Link>
          <Link href="/admin/login" className="hover:underline">
            Admin Login
          </Link>
        </nav>
      </Header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-emerald-800 to-emerald-700 px-4 py-16 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <Logo className="mx-auto mb-5 h-20 w-20" />
            <h1 className="text-3xl font-bold sm:text-4xl">{COLLEGE_NAME}</h1>
            <p className="mt-3 text-xl text-emerald-100">Computer-Based Test (CBT) Portal</p>
            <p className="mx-auto mt-4 max-w-xl text-emerald-50/90">
              Sit your examinations online and see your results immediately. Exam officers can manage students, tests
              and scores from one place.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/student/login"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-emerald-800 shadow hover:bg-emerald-50"
              >
                <GraduationCap size={20} /> Student Login
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-md border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                <ShieldCheck size={20} /> Admin Login
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <Icon className="mb-3 text-emerald-700" size={28} />
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
