import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import Courses from './components/Courses';
import MyCourses from './components/MyCourses';
import CourseForm from './components/CourseForm';
import Tests from './components/Tests';
import MyTests from './components/MyTests';
import TestForm from './components/TestForm';
import Feedback from './components/Feedback';
import FeedbackForm from './components/FeedbackForm';
import CourseDetails from './components/CourseDetails';
import TestSubmissionForm from './components/TestSubmissionForm';
import CourseContentForm from './components/CourseContentForm';
import TestGradingForm from './components/TestGradingForm';
import AssignmentSubmissionForm from './components/AssignmentSubmissionForm';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        console.log('Verifying token:', token);
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'x-auth-token': token },
          });
          const data = await res.json();
          if (res.ok) {
            console.log('User data fetched:', data);
            setUser(data);
          } else {
            console.log('Token verification failed:', data.msg);
            setToken('');
            localStorage.removeItem('token');
            navigate('/login');
          }
        } catch (err) {
          console.error('Token verification error:', err.message);
          setToken('');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } else {
        console.log('No token found, redirecting to login');
      }
    };

    fetchUser();
  }, [token, navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isHomeRoute = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 dark:text-white">
      <nav className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
        <Link to="/" className="text-2xl font-bold text-white">LearnSphere</Link>
        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-700">
          {isDarkMode ? <SunIcon className="h-6 w-6 text-yellow-300" /> : <MoonIcon className="h-6 w-6 text-gray-300" />}
        </button>
      </nav>

      {!isHomeRoute && (
        <div className="flex flex-1">
          <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}>
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={toggleSidebar} className="md:hidden">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4">
              <Link to="/courses" className="block py-2 px-4 hover:bg-gray-700">Courses</Link>
              <Link to="/my-courses" className="block py-2 px-4 hover:bg-gray-700">My Courses</Link>
              <Link to="/my-tests" className="block py-2 px-4 hover:bg-gray-700">My Tests</Link>
              <a
                href="https://my-learning-platform-flask-backend.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 px-4 hover:bg-gray-700"
              >
                AI Tools
              </a>
              {user?.role === 'teacher' || user?.role === 'Teacher' ? (
                <>
                  <Link to="/create-course" className="block py-2 px-4 hover:bg-gray-700">Create Course</Link>
                  <Link to="/create-test" className="block py-2 px-4 hover:bg-gray-700">Create Test</Link>
                </>
              ) : null}
              {user && (
                <button onClick={logout} className="block w-full text-left py-2 px-4 hover:bg-gray-700 text-red-500">Logout</button>
              )}
            </nav>
          </div>

          <div className="flex-1 md:ml-64 p-4">
            <button onClick={toggleSidebar} className="md:hidden mb-4">
              <Bars3Icon className="h-6 w-6 dark:text-white" />
            </button>
            <Routes>
              <Route path="/register" element={<Register setUser={setUser} setToken={setToken} />} />
              <Route path="/login" element={<Login setUser={setUser} setToken={setToken} />} />
              <Route path="/courses" element={<Courses user={user} token={token} />} />
              <Route path="/my-courses" element={<MyCourses user={user} token={token} />} />
              <Route path="/create-course" element={<CourseForm user={user} token={token} />} />
              <Route path="/tests/:courseId" element={<Tests user={user} token={token} />} />
              <Route path="/tests/:courseId/:testId" element={<TestSubmissionForm user={user} token={token} />} />
              <Route path="/my-tests" element={<MyTests user={user} token={token} />} />
              <Route path="/create-test" element={<TestForm user={user} token={token} />} />
              <Route path="/feedback/:courseId" element={<Feedback user={user} token={token} />} />
              <Route path="/feedback-form/:courseId" element={<FeedbackForm user={user} token={token} />} />
              <Route path="/course/:courseId" element={<CourseDetails user={user} token={token} />} />
              <Route path="/test-submission/:testId" element={<TestSubmissionForm user={user} token={token} />} />
              <Route path="/course-content/:courseId" element={<CourseContentForm user={user} token={token} />} />
              <Route path="/grade-submission/:submissionId" element={<TestGradingForm user={user} token={token} />} />
              <Route path="/assignment-submission/:courseId" element={<AssignmentSubmissionForm user={user} token={token} />} />
            </Routes>
          </div>

          {isSidebarOpen && (
            <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 md:hidden z-10"></div>
          )}
        </div>
      )}

      {isHomeRoute && (
        <div className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;