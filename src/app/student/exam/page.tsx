'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Clock } from 'lucide-react';

export default function ExamSelection() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      setError('');

      try {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
          setError('Please log in to view exams.');
          setTimeout(() => router.push('/student/login'), 2000);
          return;
        }

        const res = await fetch('/api/exams');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error fetching exams');
        }

        const data = await res.json();
        setExams(data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to the server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('studentId');
    router.push('/student/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight hover:underline">
            CBT Platform
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-lg font-medium hover:underline transition duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            Available Exams
          </h1>
          {exams.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-600 text-lg font-medium">
                No exams available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-3 truncate">
                    {exam.title}
                  </h2>
                  <div className="flex items-center space-x-2 text-gray-600 mb-4">
                    <Clock size={18} />
                    <p className="text-sm font-medium">
                      Duration: {exam.duration} minutes
                    </p>
                  </div>
                  <Link href={`/student/exam/${exam.id}`}>
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium">
                      Start Exam
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} CBT Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}