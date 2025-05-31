/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function CourseContentForm({ user, token }) {
  const { courseId } = useParams();
  const [video, setVideo] = useState('');
  const [assignment, setAssignment] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const expressApiUrl = process.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

  const openUploadWidget = () => {
    window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: 'unsigned_preset_1',
        sources: ['local', 'url', 'camera', 'dropbox', 'google_drive'],
        resourceType: 'video',
        maxFileSize: 100000000,
        clientAllowedFormats: ['mp4', 'webm', 'mov'],
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setVideo(result.info.secure_url);
        } else if (error) {
          setError('Failed to upload video: ' + error.message);
        }
      }
    ).open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${expressApiUrl}/api/courses/${courseId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ video, assignment }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/course/${courseId}`);
      } else {
        setError(data.msg || 'Failed to add content');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  if (user?.role !== 'teacher') {
    return <p className="text-center text-red-500 dark:text-red-400">Only teachers can add content.</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add Course Content</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Video (Optional)
          </label>
          <button
            type="button"
            onClick={openUploadWidget}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition mt-2"
          >
            Upload Video
          </button>
          {video && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Video uploaded: <a href={video} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">View Video</a>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assignment (Optional)
          </label>
          <textarea
            value={assignment}
            onChange={e => setAssignment(e.target.value)}
            placeholder="Enter assignment description"
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="5"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Add Content
        </button>
      </form>
    </div>
  );
}

export default CourseContentForm;