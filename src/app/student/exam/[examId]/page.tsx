'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, LogOut, Menu, X, Send } from 'lucide-react';
import { use } from 'react';

export default function ExamPage({ params: paramsPromise }: { params: Promise<{ examId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null); // Added to track the exam session
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTakenExam, setHasTakenExam] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch exam details using the session endpoint and check if the student has already taken the exam
  useEffect(() => {
    const startExamSession = async () => {
      setIsLoading(true);
      setError('');
      try {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
          setError('Please log in to take the exam.');
          setTimeout(() => router.push('/student/login'), 2000);
          return;
        }

        // Check if the student has already taken the exam
        const scoreRes = await fetch(`/api/scores/check?examId=${params.examId}&studentId=${studentId}`);
        if (!scoreRes.ok) {
          const scoreData = await scoreRes.json();
          throw new Error(scoreData.error || 'Failed to check exam status');
        }
        const scoreData = await scoreRes.json();
        if (scoreData.hasTaken) {
          setHasTakenExam(true);
          setError('You have already taken this exam.');
          return;
        }

        // Start the exam session to get the shuffled questions
        const res = await fetch('/api/exam-session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: parseInt(studentId),
            examId: parseInt(params.examId),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error starting exam session');
        }

        setExam(data.exam);
        setSessionId(data.sessionId); // Store the session ID
        const parsedQuestions = data.exam.questions.map((question: any) => ({
          ...question,
          options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
        }));
        setQuestions(parsedQuestions || []);
        setTimeLeft(data.exam.duration * 60);
        setAnswers(new Array(data.exam.questions.length).fill(-1));
      } catch (err: any) {
        setError(err.message || 'Failed to connect to the server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    startExamSession();
  }, [params.examId, router]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 || !exam || hasTakenExam) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, exam, hasTakenExam]);

  // Prevent navigation away without confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasTakenExam && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You have an ongoing exam. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasTakenExam, isSubmitting]);

  // Handle answer selection
  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  // Navigate to the next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to the previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit the exam
  const handleSubmit = async () => {
    if (isSubmitting || hasTakenExam) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const studentId = localStorage.getItem('studentId');
      if (!studentId) {
        throw new Error('Please log in to submit the exam.');
      }

      if (!sessionId) {
        throw new Error('Exam session not found. Please restart the exam.');
      }

      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: parseInt(params.examId),
          studentId: parseInt(studentId),
          sessionId, // Include the session ID
          answers, // Answers are in the shuffled order
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error submitting exam');
      }

      setMessage('Your exam is submitted.');
      setTimeout(() => {
        localStorage.removeItem('studentId'); // Log out the student
        router.push('/student/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    const confirmLogout = window.confirm(
      'You have an ongoing exam. Are you sure you want to log out? Your progress will be lost.'
    );
    if (confirmLogout) {
      setIsSidebarOpen(false);
      localStorage.removeItem('studentId');
      router.push('/student/login');
    }
  };

  // Format time left
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Exam not found or no questions available.</p>
      </div>
    );
  }

  if (hasTakenExam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:underline">
            CBT Platform
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/student/exam" className="text-lg hover:underline">
              Available Exams
            </Link>
            <button
              onClick={handleLogout}
              className="text-lg hover:underline flex items-center space-x-2"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </nav>
          {/* Hamburger Menu for Mobile */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <aside
        className={`bg-gray-800 text-white w-64 p-6 space-y-4 fixed inset-y-0 right-0 transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden transition-transform duration-300 ease-in-out z-20`}
      >
        <h2 className="text-xl font-semibold mb-6">Student Menu</h2>
        <Link
          href="/student/exam"
          className="block py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
          onClick={() => setIsSidebarOpen(false)}
        >
          Available Exams
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 py-3 px-4 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Exam Header */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="text-blue-600" size={24} />
                <h1 className="text-2xl font-semibold text-gray-800">
                  {exam.title}
                </h1>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock size={18} />
                <p>Time Left: {formatTime(timeLeft)}</p>
              </div>
            </div>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              {currentQuestion.text}
            </h2>
            <div className="space-y-3">
              {Array.isArray(currentQuestion.options) ? (
                currentQuestion.options.map((option: string, index: number) => (
                  <label
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition duration-200"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={index}
                      checked={answers[currentQuestionIndex] === index}
                      onChange={() => handleAnswerChange(currentQuestionIndex, index)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))
              ) : (
                <p className="text-red-600">Error: Question options are not available.</p>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              className={`px-4 py-2 rounded-md text-white transition duration-200 ${
                currentQuestionIndex === 0 || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-white transition duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Send size={18} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-white transition duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            )}
          </div>

          {message && (
            <p className="text-green-600 text-center mt-4">{message}</p>
          )}
          {error && (
            <p className="text-red-600 text-center mt-4">{error}</p>
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