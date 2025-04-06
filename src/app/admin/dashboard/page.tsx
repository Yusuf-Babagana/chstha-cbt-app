'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, UserPlus, Users, FileText, Eye, Download, LogOut, Trash2, Edit } from 'lucide-react';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('register-student');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for Register Student
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // State for Bulk Register
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // State for Create Exam
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('60');
  const [examFile, setExamFile] = useState<File | null>(null);
  const [isExamLoading, setIsExamLoading] = useState(false);

  // State for Download Scores
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  // State for Manage Exams
  const [exams, setExams] = useState<any[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState(true);

  // State for Manage Questions
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);

  const [message, setMessage] = useState('');

  // Fetch all exams on page load
  useEffect(() => {
    const fetchExams = async () => {
      setIsExamsLoading(true);
      setMessage('');

      try {
        const res = await fetch('/api/exams');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error fetching exams');
        }
        const data = await res.json();
        setExams(data);
      } catch (error: any) {
        setMessage(error.message || 'Failed to fetch exams');
      } finally {
        setIsExamsLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Fetch questions when an exam is selected
  useEffect(() => {
    if (selectedExamId === null) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setIsQuestionsLoading(true);
      setMessage('');

      try {
        const res = await fetch(`/api/exams/${selectedExamId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error fetching questions');
        }
        const data = await res.json();
        const parsedQuestions = data.questions.map((question: any) => ({
          ...question,
          options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
        }));
        setQuestions(parsedQuestions || []);
      } catch (error: any) {
        setMessage(error.message || 'Failed to fetch questions');
      } finally {
        setIsQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedExamId]);

  // Register a single student
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: studentUsername,
          password: studentPassword,
          fullName: studentFullName || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Student registered successfully!');
        setStudentUsername('');
        setStudentPassword('');
        setStudentFullName('');
      } else {
        setMessage(data.error || 'Error registering student');
      }
    } catch (error) {
      setMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  // Bulk register students
  const handleBulkRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      setMessage('Please upload a CSV file');
      return;
    }

    setIsBulkLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('students', bulkFile);

    try {
      const res = await fetch('/api/student/bulk', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Bulk registration successful! ${data.count} students added.`);
        setBulkFile(null);
        (document.getElementById('bulkFile') as HTMLInputElement).value = '';
      } else {
        setMessage(data.error || 'Error during bulk registration');
      }
    } catch (error) {
      setMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Create an exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!examTitle.trim()) {
      setMessage('Exam title is required');
      return;
    }
    if (!examDuration || parseInt(examDuration) <= 0) {
      setMessage('Duration must be a positive number');
      return;
    }
    if (!examFile) {
      setMessage('Questions file is required');
      return;
    }

    setIsExamLoading(true);

    const formData = new FormData();
    formData.append('title', examTitle);
    formData.append('duration', examDuration);
    formData.append('questions', examFile);

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Exam created successfully!');
        setExamTitle('');
        setExamDuration('60');
        setExamFile(null);
        (document.getElementById('examFile') as HTMLInputElement).value = '';
        // Refresh the exams list
        const examsRes = await fetch('/api/exams');
        if (examsRes.ok) {
          const examsData = await examsRes.json();
          setExams(examsData);
        }
      } else {
        setMessage(data.error || 'Error creating exam');
      }
    } catch (error) {
      setMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsExamLoading(false);
    }
  };

  // Delete an exam
  const handleDeleteExam = async (examId: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this exam? This will also delete associated scores.');
    if (!confirmDelete) return;

    setMessage('');

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Exam deleted successfully!');
        setExams(exams.filter((exam) => exam.id !== examId));
        if (selectedExamId === examId) {
          setSelectedExamId(null);
          setQuestions([]);
        }
      } else {
        setMessage(data.error || 'Error deleting exam');
      }
    } catch (error) {
      setMessage('Failed to delete exam. Please try again.');
    }
  };

  // Delete a question
  const handleDeleteQuestion = async (questionId: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this question?');
    if (!confirmDelete) return;

    setMessage('');

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Question deleted successfully!');
        setQuestions(questions.filter((question) => question.id !== questionId));
      } else {
        setMessage(data.error || 'Error deleting question');
      }
    } catch (error) {
      setMessage('Failed to delete question. Please try again.');
    }
  };

  // Download scores
  const handleDownloadScores = async () => {
    setMessage('');
    setIsDownloadLoading(true);

    try {
      const res = await fetch('/api/scores/download');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error downloading scores');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scores.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Scores downloaded successfully!');
    } catch (error: any) {
      setMessage(error.message || 'Error downloading scores');
    } finally {
      setIsDownloadLoading(false);
    }
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      setIsSidebarOpen(false);
      window.location.href = '/admin/login'; // Placeholder logout
    }
  };

  // Download sample CSV template for bulk registration
  const handleDownloadBulkTemplate = () => {
    const csvContent = 'username,password,fullName\nstudent1,pass123,John Doe\nstudent2,pass456,Jane Smith\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Sidebar navigation items with icons
  const navItems = [
    { id: 'register-student', label: 'Register Student', icon: <UserPlus size={20} /> },
    { id: 'bulk-register', label: 'Bulk Register Students', icon: <Users size={20} /> },
    { id: 'create-exam', label: 'Create Exam', icon: <FileText size={20} /> },
    { id: 'manage-exams', label: 'Manage Exams', icon: <Edit size={20} /> },
    { id: 'manage-questions', label: 'Manage Questions', icon: <Edit size={20} /> },
    { id: 'view-scores', label: 'View Scores', icon: <Eye size={20} /> },
    { id: 'download-scores', label: 'Download Scores', icon: <Download size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:underline">
            CBT Platform
          </Link>
          <nav className="hidden md:flex">
            <Link href="/" className="text-lg hover:underline">
              Home
            </Link>
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

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`bg-gray-800 text-white w-64 p-6 space-y-4 fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
        >
          <h2 className="text-xl font-semibold mb-6">Admin Menu</h2>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 py-3 px-4 rounded-md transition duration-200 ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {/* Logout Button */}
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

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Admin Dashboard</h1>

            {/* Register Student Section */}
            {activeSection === 'register-student' && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Register a Student</h2>
                <form onSubmit={handleRegisterStudent} className="space-y-5">
                  <div>
                    <label htmlFor="studentUsername" className="block text-sm font-medium text-gray-600">
                      Username
                    </label>
                    <input
                      id="studentUsername"
                      type="text"
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isRegisterLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="studentPassword" className="block text-sm font-medium text-gray-600">
                      Password
                    </label>
                    <input
                      id="studentPassword"
                      type="text"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isRegisterLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="studentFullName" className="block text-sm font-medium text-gray-600">
                      Full Name (Optional)
                    </label>
                    <input
                      id="studentFullName"
                      type="text"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isRegisterLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-200 ${
                      isRegisterLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isRegisterLoading}
                  >
                    {isRegisterLoading ? 'Registering...' : 'Register Student'}
                  </button>
                </form>
              </div>
            )}

            {/* Bulk Register Students Section */}
            {activeSection === 'bulk-register' && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Bulk Register Students</h2>
                <form onSubmit={handleBulkRegister} className="space-y-5">
                  <div>
                    <label htmlFor="bulkFile" className="block text-sm font-medium text-gray-600">
                      Upload Students CSV (username,password,fullName)
                    </label>
                    <input
                      id="bulkFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isBulkLoading}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      CSV format: username,password,fullName (fullName is optional)
                    </p>
                    <p className="text-sm text-gray-500">
                      <button
                        type="button"
                        onClick={handleDownloadBulkTemplate}
                        className="text-blue-500 hover:underline"
                      >
                        Download sample CSV template
                      </button>
                    </p>
                  </div>
                  <button
                    type="submit"
                    className={`w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-200 ${
                      isBulkLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isBulkLoading}
                  >
                    {isBulkLoading ? 'Registering...' : 'Bulk Register'}
                  </button>
                </form>
              </div>
            )}

            {/* Create Exam Section */}
            {activeSection === 'create-exam' && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Create Exam</h2>
                <form onSubmit={handleCreateExam} className="space-y-5">
                  <div>
                    <label htmlFor="examTitle" className="block text-sm font-medium text-gray-600">
                      Exam Title
                    </label>
                    <input
                      id="examTitle"
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isExamLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="examDuration" className="block text-sm font-medium text-gray-600">
                      Duration (in minutes)
                    </label>
                    <input
                      id="examDuration"
                      type="number"
                      value={examDuration}
                      onChange={(e) => setExamDuration(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="1"
                      disabled={isExamLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="examFile" className="block text-sm font-medium text-gray-600">
                      Upload Questions CSV (text,option1,option2,option3,option4,correct)
                    </label>
                    <input
                      id="examFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isExamLoading}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      CSV format: text,option1,option2,option3,option4,correct (correct is the index 0-3)
                    </p>
                    <p className="text-sm text-gray-500">
                      <Link href="/sample-questions.csv" download className="text-blue-500 hover:underline">
                        Download sample CSV template
                      </Link>
                    </p>
                  </div>
                  <button
                    type="submit"
                    className={`w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-200 ${
                      isExamLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isExamLoading}
                  >
                    {isExamLoading ? 'Creating...' : 'Create Exam'}
                  </button>
                </form>
              </div>
            )}

            {/* Manage Exams Section */}
            {activeSection === 'manage-exams' && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Manage Exams</h2>
                {isExamsLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading exams...</p>
                  </div>
                ) : exams.length === 0 ? (
                  <p className="text-gray-600 text-center">No exams available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration (min)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Questions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {exams.map((exam) => (
                          <tr key={exam.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {exam.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {exam.duration}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {exam.questions.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleDeleteExam(exam.id)}
                                className="text-red-600 hover:text-red-800 transition duration-200"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Manage Questions Section */}
            {activeSection === 'manage-questions' && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Manage Questions</h2>
                <div className="mb-6">
                  <label htmlFor="examSelect" className="block text-sm font-medium text-gray-600 mb-2">
                    Select Exam
                  </label>
                  <select
                    id="examSelect"
                    value={selectedExamId || ''}
                    onChange={(e) => setSelectedExamId(e.target.value ? parseInt(e.target.value) : null)}
                    className="block w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select an Exam --</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedExamId === null ? (
                  <p className="text-gray-600 text-center">Please select an exam to view its questions.</p>
                ) : isQuestionsLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading questions...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <p className="text-gray-600 text-center">No questions available for this exam.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Question Text
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Options
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Correct Answer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {questions.map((question) => (
                          <tr key={question.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {question.text}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {Array.isArray(question.options) ? question.options.join(', ') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {question.correct !== undefined ? question.options[question.correct] : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="text-red-600 hover:text-red-800 transition duration-200"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* View Scores Section */}
            {activeSection === 'view-scores' && (
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">View Scores</h2>
                <Link href="/admin/scores">
                  <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-200">
                    Go to Scores Page
                  </button>
                </Link>
              </div>
            )}

            {/* Download Scores Section */}
            {activeSection === 'download-scores' && (
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Download Scores</h2>
                <button
                  onClick={handleDownloadScores}
                  className={`w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-200 ${
                    isDownloadLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isDownloadLoading}
                >
                  {isDownloadLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      <span>Download Scores as CSV</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {message && (
              <p
                className={`text-sm text-center mt-6 ${
                  message.includes('successfully') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </main>
      </div>

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