'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Upload } from 'lucide-react';

export default function CreateExam() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      console.log('File selected:', selectedFile.name);
    } else {
      setFile(null);
      console.log('No file selected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Log the form values for debugging
    console.log('Form Values:', { title, duration, file: file?.name });

    // Client-side validation
    if (!title.trim()) {
      setError('Exam title is required');
      setIsSubmitting(false);
      return;
    }
    if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      setError('Duration must be a positive number');
      setIsSubmitting(false);
      return;
    }
    if (!file) {
      setError('Questions file is required');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('duration', duration);
    formData.append('questions', file);

    // Log the FormData entries for debugging
    for (const [key, value] of formData.entries()) {
      console.log(`FormData Entry - ${key}:`, value instanceof File ? value.name : value);
    }

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Error creating exam');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'text,option1,option2,option3,option4,correct\n"What is 2 + 2?","3","4","5","6",1\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-6">Admin Menu</h2>
        <Link
          href="/admin/register-student"
          className="block py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
        >
          Register Student
        </Link>
        <Link
          href="/admin/bulk-register"
          className="block py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
        >
          Bulk Register Students
        </Link>
        <Link
          href="/admin/create-exam"
          className="block py-3 px-4 rounded-md bg-blue-600 text-white transition duration-200"
        >
          Create Exam
        </Link>
        <Link
          href="/admin/scores"
          className="block py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
        >
          View Scores
        </Link>
        <Link
          href="/admin/download-scores"
          className="block py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
        >
          Download Scores
        </Link>
        <Link
          href="/"
          className="block py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
        >
          Logout
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Create Exam
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-gray-700">
                Exam Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-gray-700">
                Duration (in minutes)
              </label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label htmlFor="questions" className="block text-gray-700">
                Upload Questions CSV (text,option1,option2,option3,option4,correct)
              </label>
              <input
                type="file"
                id="questions"
                name="questions"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-gray-600 text-sm mt-2">
                CSV format: text,option1,option2,option3,option4,correct [correct is the index 0-3]
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-blue-600 hover:underline text-sm mt-2"
              >
                Download sample CSV template
              </button>
            </div>
            {error && <p className="text-red-600 text-center">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 rounded-md text-white transition duration-200 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Exam'}
            </button>
          </form>
          <p className="text-center text-gray-600 mt-4">
            <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
              <Home className="inline-block mr-1" size={16} />
              Back to Dashboard
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}