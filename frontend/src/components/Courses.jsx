import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Courses({ user, token }) {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/courses')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        setCourses(data);
      })
      .catch(err => {
        setError('Failed to load courses: ' + err.message);
      });
  }, []);

  const enroll = async (courseId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/enroll/${courseId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(courses.map(course =>
          course._id === courseId ? data : course
        ));
      } else {
        setError(data.msg || 'Failed to enroll');
      }
    } catch (err) {
      setError('Enrollment failed: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">All Courses</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      {courses.length === 0 && !error && (
        <p className="text-gray-600 dark:text-gray-400">No courses available.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{course.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Teacher: {course.teacher?.name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Students: {course.enrolledStudents?.length || 0}
            </p>
            <div className="mt-2 flex space-x-2">
              <Link
                to={`/course/${course._id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                View Details
              </Link>
              {user?.role === 'student' && !course.enrolledStudents?.some(student => student._id === user._id) && (
                <button
                  onClick={() => enroll(course._id)}
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                >
                  Enroll
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Courses;