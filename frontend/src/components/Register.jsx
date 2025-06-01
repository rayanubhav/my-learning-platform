/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register({ setUser, setToken }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
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
      const res = await fetch(`${expressApiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        navigate('/my-courses');
      } else {
        setError(data.msg || 'Registration failed');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Register</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select a role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Register
        </button>
        <Link
          to="/login"
          className="w-full block text-center bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition"
        >
          Login
        </Link>
      </form>
    </div>
  );
}

export default Register;