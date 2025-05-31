/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function FeedbackForm({ user, token }) {
  const { courseId } = useParams();
  const [formData, setFormData] = useState({
    rating: '',
    comment: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const expressApiUrl = process.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${expressApiUrl}/api/feedback/course/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/feedback/${courseId}`);
      } else {
        setError(data.msg || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  if (user?.role !== 'student') {
    return <p className="text-center text-red-500 mt-10 dark:text-red-400">Only students can submit feedback.</p>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Submit Feedback</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rating (1-5)
          </label>
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="1"
            max="5"
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comment
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="4"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
}

export default FeedbackForm;