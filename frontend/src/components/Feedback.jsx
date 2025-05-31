import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function Feedback({ user, token }) {
  const { courseId } = useParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && user) {
      console.log('Fetching feedback for course:', courseId);
      fetch(`http://localhost:5000/api/feedback/course/${courseId}`, {
        headers: { 'x-auth-token': token },
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('Feedback data:', data);
          setFeedbacks(data);
        })
        .catch(err => {
          console.error('Feedback fetch error:', err);
          setError('Failed to load feedback: ' + err.message);
        });
    }
  }, [token, user, courseId]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      {feedbacks.length === 0 && !error && (
        <p className="text-gray-600 dark:text-gray-400">No feedback available.</p>
      )}
      {feedbacks.map(feedback => (
        <div key={feedback._id} className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Rating: {feedback.rating}/5
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{feedback.comment}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            By {feedback.student?.name || 'Unknown'} on {new Date(feedback.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
      {user?.role === 'student' && (
        <Link
          to={`/feedback-form/${courseId}`}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Add Feedback
        </Link>
      )}
    </div>
  );
}

export default Feedback;