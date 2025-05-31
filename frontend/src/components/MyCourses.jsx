/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function MyCourses({ user, token }) {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const expressApiUrl = process.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';
  useEffect(() => {
    if (token && user) {
      fetch(`${expressApiUrl}/api/courses/my-courses`, {
        headers: { 'x-auth-token': token },
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(`HTTP error ${res.status}: ${data.msg || res.statusText}`);
            });
          }
          return res.json();
        })
        .then(data => {
          setCourses(data);
        })
        .catch(err => {
          setError('Failed to load courses: ' + err.message);
        });
    }
  }, [token, user]);

  if (!user) {
    return <p className="text-red-500 text-center mt-10">Please log in to view your courses.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">
        {user.role === 'student' ? 'My Enrolled Courses' : 'My Created Courses'}
      </h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {courses.length === 0 && !error && (
        <p className="text-gray-600 dark:text-gray-400">
          No courses found. {user.role === 'student' ? 'Enroll in a course!' : 'Create a course!'}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 dark:text-white">{course.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
            {user.role === 'student' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Teacher: {course.teacher?.name || 'Unknown'}
              </p>
            )}
            {user.role === 'teacher' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Students: {course.enrolledStudents?.length || 0}
              </p>
            )}
            <Link
              to={`/course/${course._id}`}
              className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyCourses;