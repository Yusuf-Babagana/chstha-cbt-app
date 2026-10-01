import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Student Login' };

export default function StudentLogin() {
  return (
    <LoginForm
      title="Student Login"
      subtitle="Sign in with the username and password given to you by the exam officer."
      endpoint="/api/student/login"
      redirectTo="/student/exam"
      usernameLabel="Username / Registration No."
      switchLink={{ href: '/admin/login', label: 'Staff? Go to admin login' }}
    />
  );
}
