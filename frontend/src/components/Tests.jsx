/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Tests({ user, token }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const expressApiUrl = process.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';
  useEffect(() => {
    fetchTests();
  }, [courseId, token]);

  const fetchTests = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tests/${courseId}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        setTests(data);
      } else {
        setError(data.msg || 'Failed to load tests');
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    }
  };

  const handleGenerateTest = async () => {
    try {
      const res = await fetch(`${expressApiUrl}/api/tests/${courseId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchTests();
      } else {
        setError(data.msg || 'Failed to generate test');
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    }
  };

  if (error) {
    return <p className="text-red-500 text-center mt-10 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="container mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Tests</h2>
      {user?.role === 'teacher' && (
        <div className="mb-6">
          <button
            onClick={handleGenerateTest}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
          >
            Generate Test with AI
          </button>
        </div>
      )}
      {tests.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No tests available.</p>
      ) : (
        tests.map(test => {
          const studentSubmission = test.submissions.find(sub => sub.student?._id === user?._id);

          return (
            <div key={test._id} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{test.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">{test.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due Date: {test.dueDate ? new Date(test.dueDate).toLocaleString() : 'No due date'}
              </p>
              {user?.role === 'student' && !studentSubmission ? (
                test.questions.length > 0 ? (
                  <button
                    onClick={() => navigate(`/tests/${courseId}/${test._id}`)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    Start Test
                  </button>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">This test has no questions to answer.</p>
                )
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'student' ? 'You have already submitted this test.' : 'Test details are only available for students to take.'}
                </p>
              )}
              {studentSubmission && test.questions.length > 0 && (
                <div className="mt-4 p-4 bg-green-100 dark:bg-green-800 rounded-md">
                  <p className="text-gray-900 dark:text-white">
                    Your Score: {studentSubmission.score} / {test.questions.length}
                  </p>
                </div>
              )}
              {user?.role === 'teacher' && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Submissions</h4>
                  {test.submissions.length > 0 ? (
                    test.submissions.map(sub => (
                      <div key={sub._id} className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Student: {sub.student?.name || 'Unknown'}
                        </p>
                        {test.questions.length > 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Score: {sub.score} / {test.questions.length}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            No questions answered
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No submissions yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Tests;