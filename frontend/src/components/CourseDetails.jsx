/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Feedback from './Feedback';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function CourseDetails({ user, token }) {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoWatched, setVideoWatched] = useState(null);
  const expressApiUrl = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!token || !user) {
      setError('Please log in to view course details');
      return;
    }

    const fetchCourse = async () => {
      try {
        const res = await fetch(`${expressApiUrl}/api/courses/${courseId}`, {
          headers: { 'x-auth-token': token },
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        setError(`Failed to load course: ${err.message}`);
      }
    };

    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`${expressApiUrl}/api/assignment-submissions/course/${courseId}`, {
          headers: { 'x-auth-token': token },
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        console.log(err)
      }
    };

    const fetchProgress = async () => {
      if (user?.role !== 'student') return;
      try {
        const res = await fetch(`${expressApiUrl}/api/video-progress/${courseId}`, {
          headers: { 'x-auth-token': token },
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        setProgress(data || []);
      } catch (err) {
        setProgress([]);
      }
    };

    fetchCourse();
    fetchSubmissions();
    fetchProgress();
  }, [token, user, courseId]);

  const markAsWatched = async (videoIndex) => {
    try {
      const res = await fetch(`${expressApiUrl}/api/video-progress/${courseId}/${videoIndex}`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProgress((prev) => {
          const updatedProgress = [...prev];
          const index = updatedProgress.findIndex((p) => p.videoIndex === videoIndex);
          if (index >= 0) {
            updatedProgress[index] = data;
          } else {
            updatedProgress.push(data);
          }
          return updatedProgress;
        });
        setVideoWatched(videoIndex);
      }
    } catch (err) {
      console.log(err)
    }
  };

  if (error) {
    return <p className="text-red-500 text-center mt-10 dark:text-red-400">{error}</p>;
  }

  if (!course) {
    return <p className="text-gray-600 text-center mt-10 dark:text-gray-400">Loading...</p>;
  }

  const totalVideos = course.videos?.length || 0;
  const watchedVideos = progress.filter((p) => p.watched).length;
  const progressPercentage = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

  return (
    <div className="container mx-auto mt-10 p-4">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{course.title}</h2>
      <p className="text-gray-600 mb-4 dark:text-gray-300">{course.description}</p>
      <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
        Teacher: {course.teacher?.name || 'Unknown'}
      </p>
      <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">
        Enrolled Students: {course.enrolledStudents?.length || 0}
      </p>

      {user?.role === 'student' && totalVideos > 0 && (
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-800 rounded-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h3>
          <div className="w-24 h-24 mx-auto mt-2">
            <CircularProgressbar
              value={progressPercentage}
              text={`${progressPercentage}%`}
              styles={buildStyles({
                textColor: '#1f2937',
                pathColor: '#2563eb',
                trailColor: '#d1d5db',
                textSize: '24px',
              })}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 text-center">
            {watchedVideos}/{totalVideos} videos watched
          </p>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Content</h3>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Videos</h4>
          {course.videos?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.videos.map((video, index) => {
                const isWatched = progress.some(
                  (p) => p.videoIndex === index && p.watched
                );
                return (
                  <div
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md shadow-sm hover:shadow-md transition"
                  >
                    <video
                      src={video}
                      className="w-full h-32 object-cover rounded-md mb-2"
                      muted
                      onClick={() => setSelectedVideo({ url: video, index })}
                    />
                    <h5 className="text-md font-medium text-gray-900 dark:text-white">
                      Video {index + 1}
                    </h5>
                    <div className="mt-2 flex justify-between items-center">
                      {user?.role === 'student' && (
                        <span
                          className={`text-sm ${
                            isWatched ? 'text-green-500' : 'text-gray-500'
                          }`}
                        >
                          {isWatched ? 'Watched' : 'Not Watched'}
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedVideo({ url: video, index })}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Watch Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No videos available.</p>
          )}

          <h4 className="text-lg font-medium mt-4 mb-2 text-gray-900 dark:text-white">Assignments</h4>
          {course.assignments?.length > 0 ? (
            <ul className="list-disc pl-5">
              {course.assignments.map((assignment, index) => (
                <li key={index} className="text-gray-600 dark:text-gray-300">{assignment}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No assignments available.</p>
          )}

          <div className="mt-4 flex space-x-4">
            <Link
              to={`/tests/${courseId}`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              View Tests
            </Link>
            {user?.role === 'teacher' && (
              <Link
                to={`/course-content/${courseId}`}
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                Add Content
              </Link>
            )}
            {user?.role === 'student' && (
              <Link
                to={`/assignment-submission/${courseId}`}
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
              >
                Submit Assignment
              </Link>
            )}
          </div>
        </div>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Watch Video {selectedVideo.index + 1}</h3>
              <button
                onClick={() => {
                  setSelectedVideo(null);
                  setVideoWatched(null);
                }}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
              >
                Close
              </button>
            </div>
            <video
              controls
              src={selectedVideo.url}
              className="w-full"
              autoPlay
              onEnded={() => {
                if (user?.role === 'student') {
                  markAsWatched(selectedVideo.index);
                }
              }}
            />
          </div>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {submissions.map((sub) => (
              <div key={sub._id} className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Student: {sub.student?.name || 'Unknown'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Assignment: {sub.assignment}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Response: {sub.response}
                </p>
                {sub.videoUrl && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Video Submission:</p>
                    <video controls src={sub.videoUrl} className="w-full mt-1 rounded-md" />
                  </div>
                )}
                {sub.wordUrl && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Word Submission:</p>
                    <a
                      href={sub.wordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Word File
                    </a>
                  </div>
                )}
                {sub.pdfUrl && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">PDF Submission:</p>
                    <a
                      href={sub.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View PDF
                    </a>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Feedback</h3>
        <Feedback user={user} token={token} />
      </div>
    </div>
  );
}

export default CourseDetails;