'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Footer, Header, inputClass, primaryBtn } from './Shell';
import { errMsg } from '@/lib/utils';

export default function LoginForm({
  title,
  subtitle,
  endpoint,
  redirectTo,
  usernameLabel,
  switchLink,
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  redirectTo: string;
  usernameLabel: string;
  switchLink: { href: string; label: string };
}) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(errMsg(err, 'Could not reach the server. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        <Link href="/" className="text-sm hover:underline">
          Home
        </Link>
      </Header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <h1 className="text-center text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mb-6 mt-1 text-center text-sm text-gray-500">{subtitle}</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {usernameLabel}
              </label>
              <input
                id="username"
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <Alert kind="error">{error}</Alert>}
            <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href={switchLink.href} className="text-emerald-700 hover:underline">
              {switchLink.label}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
