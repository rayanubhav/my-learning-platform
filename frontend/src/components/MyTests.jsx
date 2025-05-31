/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyTests({ user, token }) {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const expressApiUrl = import.meta.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${expressApiUrl}/api/tests/my-tests`, {
          headers: {
            'x-auth-token': token,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setTests(data);
        } else {
          setError(data.msg || 'Failed to fetch tests');
        }
      } catch (err) {
        setError('Server error while fetching tests: ' + err.message);
      }
    };

    if (!user) {
      setError('Please log in to view your tests');
      navigate('/login');
      return;
    }

    fetchTests();
  }, [user, token, navigate]);

  if (error) {
    return <p className="text-red-500 text-center mt-10 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="container mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">My Tests</h2>
      {tests.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          {user.role === 'teacher' || user.role === 'Teacher'
            ? 'You have not created any tests yet.'
            : 'No tests available in your enrolled courses.'}
        </p>
      ) : (
        tests.map(test => {
          const studentSubmission = test.submissions.find(sub => sub.student?._id === user?._id);
          const isTeacher = user.role === 'teacher' || user.role === 'Teacher';

          return (
            <div key={test._id} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{test.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">{test.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Course: {test.course?.title || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due Date: {test.dueDate ? new Date(test.dueDate).toLocaleString() : 'No due date'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Questions: {test.questions.length}
              </p>
              {isTeacher ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submissions: {test.submissions.length}
                  </p>
                  <button
                    onClick={() => navigate(`/tests/${test.course._id}`)}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    View Test
                  </button>
                </>
              ) : (
                <>
                  {studentSubmission ? (
                    test.questions.length > 0 ? (
                      <div className="mt-2 p-2 bg-green-100 dark:bg-green-800 rounded-md">
                        <p className="text-gray-900 dark:text-white">
                          Your Score: {studentSubmission.score} / {test.questions.length}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Test submitted (no questions).
                      </p>
                    )
                  ) : (
                    <button
                      onClick={() => navigate(`/tests/${test.course._id}`)}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      Take Test
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default MyTests;