const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();

// Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// Connect Database
connectDB();

// CORS configuration
const allowedOrigins = [
  'https://my-learning-platform-app.vercel.app/', // Deployed React frontend (e.g., https://education-platform-frontend.onrender.com)
  'http://localhost:5173', // Local React frontend
  'http://localhost:8501', // Local Streamlit app
  'https://my-learning-platform-flask-backend.onrender.com', // Deployed Streamlit app (if applicable)
].filter(Boolean); // Remove undefined/null values

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If using cookies or JWT with credentials
}));

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/test-submissions', require('./routes/testSubmissions'));
app.use('/api/assignment-submissions', require('./routes/assignmentSubmissions'));
app.use('/api/video-progress', require('./routes/videoProgress'));

// Test route
app.get('/', (req, res) => {
  res.json({ msg: 'Welcome to LearnSphere API' });
});

// Handle 404 errors
app.use((req, res, next) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ msg: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ msg: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

