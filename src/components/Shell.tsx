import Link from 'next/link';
import { APP_NAME, COLLEGE_NAME, COLLEGE_SHORT } from '@/lib/brand';

export function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="" className={className} />;
}

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-emerald-800 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="leading-tight">
            <span className="block text-lg font-bold">{COLLEGE_SHORT}</span>
            <span className="block text-xs text-emerald-100">{APP_NAME}</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">{children}</div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 px-4 py-4 text-center text-sm text-gray-300">
      © {new Date().getFullYear()} {COLLEGE_NAME}. All rights reserved.
    </footer>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-gray-600" role="status">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-400';
export const dangerBtn =
  'inline-flex items-center justify-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400';
