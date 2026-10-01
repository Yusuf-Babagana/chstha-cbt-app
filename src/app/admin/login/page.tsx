import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Admin Login' };

export default function AdminLogin() {
  return (
    <LoginForm
      title="Admin Login"
      subtitle="Authorised exam officers only."
      endpoint="/api/admin/login"
      redirectTo="/admin/dashboard"
      usernameLabel="Admin username"
      switchLink={{ href: '/student/login', label: 'Student? Go to student login' }}
    />
  );
}
