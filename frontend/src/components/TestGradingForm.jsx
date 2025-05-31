/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function TestGradingForm({ user, token }) {
  const { submissionId } = useParams();
  const [grade, setGrade] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const expressApiUrl = process.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${expressApiUrl}/api/test-submissions/grade/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ grade: parseInt(grade) }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/tests/${data.test}`);
      } else {
        setError(data.msg || 'Failed to submit grade');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  if (user?.role !== 'teacher') {
    return <p className="text-center text-red-500 dark:text-red-400">Only teachers can grade submissions.</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Grade Submission</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Grade (0-100)
          </label>
          <input
            type="number"
            value={grade}
            onChange={e => setGrade(e.target.value)}
            min="0"
            max="100"
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Submit Grade
        </button>
      </form>
    </div>
  );
}

export default TestGradingForm; 