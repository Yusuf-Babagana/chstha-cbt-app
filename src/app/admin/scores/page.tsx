'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores');
        const data = await res.json();
        if (res.ok) {
          setScores(data);
        } else {
          setMessage('Error fetching scores');
        }
      } catch (error) {
        setMessage('Error fetching scores');
      }
    };
    fetchScores();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:underline">
            CBT Platform
          </Link>
          <nav>
            <Link href="/" className="text-lg hover:underline">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Exam Scores</h1>
          {scores.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-4 text-left text-sm font-semibold">Student Username</th>
                    <th className="p-4 text-left text-sm font-semibold">Exam Title</th>
                    <th className="p-4 text-left text-sm font-semibold">Score</th>
                    <th className="p-4 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, index) => (
                    <tr
                      key={score.id}
                      className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition duration-150`}
                    >
                      <td className="p-4 text-gray-700">{score.student.username}</td>
                      <td className="p-4 text-gray-700">{score.exam.title}</td>
                      <td className="p-4 text-gray-700">{score.score}</td>
                      <td className="p-4 text-gray-700">{new Date(score.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 text-lg">No scores available.</p>
          )}
          {message && <p className="text-sm text-center mt-6 text-red-600">{message}</p>}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} CBT Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}