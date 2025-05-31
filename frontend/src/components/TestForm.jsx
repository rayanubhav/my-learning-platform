/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TestForm({ user, token }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
  });
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/courses/my-courses', {
          headers: {
            'x-auth-token': token,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setCourses(data);
        } else {
          setError(data.msg || 'Failed to fetch courses');
        }
      } catch (err) {
        setError('Server error while fetching courses: ' + err.message);
      }
    };

    if (!user || (user.role !== 'teacher' && user.role !== 'Teacher')) {
      setError('Only teachers can create tests');
      navigate('/login');
      return;
    }

    fetchCourses();
  }, [user, token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/my-tests');
      } else {
        setError(data.msg || 'Failed to create test');
        if (res.status === 403 || res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Test</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course</label>
          <select
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
          <input
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Create Test
        </button>
      </form>
    </div>
  );
}

export default TestForm;