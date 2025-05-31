import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function TestSubmissionForm({ user, token }) {
  const { courseId, testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 3;

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tests/test/${testId}`, {
          headers: { 'x-auth-token': token },
        });
        const data = await res.json();
        if (res.ok) {
          setTest(data);
        } else {
          setError(data.msg || 'Failed to load test');
          navigate(`/tests/${courseId}`);
        }
      } catch (err) {
        setError('Server error: ' + err.message);
        navigate(`/tests/${courseId}`);
      }
    };
    fetchTest();
  }, [courseId, testId, token, navigate]);

  // Enter full-screen mode when test starts
  useEffect(() => {
    const enterFullScreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullScreen(true);
    };
    if (test) {
      enterFullScreen();
    }

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        setIsFullScreen(false);
        handleSuspiciousActivity('Exited full-screen mode');
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, [test]);

  // Detect tab switching or window focus changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSuspiciousActivity('Switched tabs or minimized window');
      }
    };

    const handleBlur = () => {
      handleSuspiciousActivity('Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Disable copy-paste
  useEffect(() => {
    const preventCopyPaste = (e) => {
      if (e.type === 'copy' || e.type === 'paste' || e.type === 'cut') {
        e.preventDefault();
        handleSuspiciousActivity('Attempted to copy/paste');
      }
    };

    window.addEventListener('copy', preventCopyPaste);
    window.addEventListener('paste', preventCopyPaste);
    window.addEventListener('cut', preventCopyPaste);

    return () => {
      window.removeEventListener('copy', preventCopyPaste);
      window.removeEventListener('paste', preventCopyPaste);
      window.removeEventListener('cut', preventCopyPaste);
    };
  }, []);

  const handleSuspiciousActivity = async (message) => {
    setWarnings((prev) => prev + 1);
    alert(`Warning: ${message}. This is warning ${warnings + 1} of ${MAX_WARNINGS}.`);

    try {
      await fetch('http://localhost:5000/api/tests/log-suspicious-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({
          testId,
          userId: user._id,
          activity: message,
        }),
      });
    } catch (err) {
      console.error('Error logging suspicious activity:', err);
    }

    if (warnings + 1 >= MAX_WARNINGS) {
      alert('Too many warnings. Test terminated due to suspicious activity.');
      navigate(`/tests/${courseId}`);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const answerArray = Object.keys(answers).map((key) => answers[key]);

    if (answerArray.length !== test.questions.length) {
      setError('Please answer all questions');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ answers: answerArray }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/tests/${courseId}`);
      } else {
        setError(data.msg || 'Failed to submit test');
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    }
  };

  if (user?.role !== 'student') {
    return <p className="text-center text-red-500 mt-10 dark:text-red-400">Only students can submit tests.</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-10 dark:text-red-400">{error}</p>;
  }

  if (!test) {
    return <p className="text-gray-600 text-center mt-10 dark:text-gray-400">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">{test.title}</h2>
      {!isFullScreen && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
          Please enter full-screen mode to continue the test.
          <button
            onClick={() => document.documentElement.requestFullscreen()}
            className="ml-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Enter Full-Screen
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {test.questions.map((q, qIndex) => (
          <div key={qIndex} className="mb-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Question {qIndex + 1}: {q.question}
            </p>
            <div className="mt-2">
              {q.options.map((option, oIndex) => (
                <label key={oIndex} className="block text-gray-600 dark:text-gray-300">
                  <input
                    type="radio"
                    name={`test-${testId}-q-${qIndex}`}
                    value={option}
                    onChange={() => handleAnswerChange(qIndex, option)}
                    className="mr-2"
                    disabled={!isFullScreen}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          disabled={!isFullScreen}
        >
          Submit Test
        </button>
      </form>
    </div>
  );
}

export default TestSubmissionForm;