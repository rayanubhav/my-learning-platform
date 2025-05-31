/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function AssignmentSubmissionForm({ user, token }) {
  const { courseId } = useParams();
  const [assignment, setAssignment] = useState('');
  const [response, setResponse] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [wordUrl, setWordUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const expressApiUrl = import.meta.env.REACT_APP_EXPRESS_API_URL || 'http://localhost:5000';
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

  const openVideoUploadWidget = () => {
    if (!cloudName) {
      setError('Cloudinary cloud name is not configured.');
      return;
    }

    window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: 'unsigned_preset_1',
        sources: ['local', 'url', 'dropbox', 'google_drive'],
        resourceType: 'video',
        maxFileSize: 100000000,
        clientAllowedFormats: ['mp4', 'webm', 'mov'],
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setVideoUrl(result.info.secure_url);
        } else if (error) {
          setError('Failed to upload video: ' + error.message);
        }
      }
    ).open();
  };

  const openWordUploadWidget = () => {
    if (!cloudName) {
      setError('Cloudinary cloud name is not configured.');
      return;
    }

    window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: 'unsigned_preset_1',
        sources: ['local', 'url', 'dropbox', 'google_drive'],
        resourceType: 'raw',
        maxFileSize: 10000000,
        clientAllowedFormats: ['doc', 'docx'],
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setWordUrl(result.info.secure_url);
        } else if (error) {
          setError('Failed to upload Word file: ' + error.message);
        }
      }
    ).open();
  };

  const openPdfUploadWidget = () => {
    if (!cloudName) {
      setError('Cloudinary cloud name is not configured.');
      return;
    }

    window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: 'unsigned_preset_1',
        sources: ['local', 'url', 'dropbox', 'google_drive'],
        resourceType: 'raw',
        maxFileSize: 10000000,
        clientAllowedFormats: ['pdf'],
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setPdfUrl(result.info.secure_url);
        } else if (error) {
          setError('Failed to upload PDF file: ' + error.message);
        }
      }
    ).open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${expressApiUrl}/api/assignment-submissions/course/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ assignment, response, videoUrl, wordUrl, pdfUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/course/${courseId}`);
      } else {
        setError(data.msg || 'Failed to submit assignment');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  if (user?.role !== 'student') {
    return <p className="text-center text-red-500 dark:text-red-400">Only students can submit assignments.</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Submit Assignment</h2>
      {error && <p className="text-red-500 mb-4 dark:text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assignment
          </label>
          <input
            type="text"
            value={assignment}
            onChange={e => setAssignment(e.target.value)}
            placeholder="Enter assignment description"
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Response
          </label>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response"
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="5"
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Video (Optional)
          </label>
          <button
            type="button"
            onClick={openVideoUploadWidget}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition mt-2"
          >
            Upload Video
          </button>
          {videoUrl && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Video uploaded: <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">View Video</a>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Word Document (Optional)
          </label>
          <button
            type="button"
            onClick={openWordUploadWidget}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition mt-2"
          >
            Upload Word File
          </button>
          {wordUrl && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Word file uploaded: <a href={wordUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">View Word File</a>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload PDF (Optional)
          </label>
          <button
            type="button"
            onClick={openPdfUploadWidget}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition mt-2"
          >
            Upload PDF
          </button>
          {pdfUrl && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              PDF uploaded: <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">View PDF</a>
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          Submit Assignment
        </button>
      </form>
    </div>
  );
}

export default AssignmentSubmissionForm;