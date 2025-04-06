'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative bg-gray-100">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1550831107-1553da8c8464?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')`, // Replace with your own image URL or place an image in /public
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-white bg-opacity-80"></div> {/* Semi-transparent overlay */}
      </div>

      {/* Header Section */}
      <header className="bg-blue-600 text-white p-6 shadow-md relative z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">CHSTH Hadejia</h1>
          <nav className="space-x-6">
            <Link href="/student" className="text-lg hover:underline">
              Student Login
            </Link>
            <Link href="/admin" className="text-lg hover:underline">
              Admin Login
            </Link>
            <Link href="/admin/dashboard" className="text-lg hover:underline">
              Admin Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center p-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Total Health Care Solution
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Welcome To College Of Health Science and Technology Hadejia. Committed to providing high-quality education, fostering innovation, and supporting our students and faculty in their pursuit of excellence.
          </p>
          <p className="text-md text-gray-600 mb-4">
            <strong>Mission:</strong> To fill identified gaps and add value to the content and quality of training given to health care providers and professionals who will provide quality service to their communities with sound professional skills and competence for the development of their communities and satisfaction of their employer.
          </p>
          <p className="text-md text-gray-600 mb-8">
            <strong>Vision:</strong> To ensure the maintenance of a health care delivery workforce that will implement government health policies with confidence and skills needed for service delivery by creating demand for such services.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/student">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition duration-200 text-lg font-medium">
                Student Login
              </button>
            </Link>
            <Link href="/admin/dashboard">
              <button className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition duration-200 text-lg font-medium">
                Admin Dashboard
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Floating Sidebar (Simplified) */}
      <aside className="hidden lg:block fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-800 text-white p-4 rounded-l-lg shadow-lg z-20">
        <div className="flex flex-col space-y-4">
          <button className="flex items-center space-x-2 hover:bg-blue-700 p-2 rounded">
            <span className="text-sm">Home</span>
          </button>
          <button className="flex items-center space-x-2 hover:bg-blue-700 p-2 rounded">
            <span className="text-sm">Info</span>
          </button>
          <button className="flex items-center space-x-2 hover:bg-blue-700 p-2 rounded">
            <span className="text-sm">Manage</span>
          </button>
        </div>
      </aside>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white p-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} College of Health Science and Technology Hadejia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}