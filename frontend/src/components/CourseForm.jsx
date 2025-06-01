/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CourseForm({ user, token }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videos: [],
    assignments: [],
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const expressApiUrl = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:5000';
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${expressApiUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/my-courses');
      } else {
        setError(data.msg || 'Failed to create course');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  if (user?.role !== 'teacher') {
    return <p className="text-center text-red-500 mt-10 dark:text-red-400">Only teachers can create courses.</p>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Create Course</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="4"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Create Course
        </button>
      </form>
    </div>
  );
}

export default CourseForm;