const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();

// Connect Database
connectDB();

// CORS configuration
const allowedOrigins = [
  'https://my-learning-platform-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:8501',
  'https://my-learning-platform-flask-backend.onrender.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    console.log('Request Origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS Error: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
}));

app.options('*', cors());

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes with Debugging
const routes = [
  { path: '/api/users', handler: require('./routes/users') },
  { path: '/api/auth', handler: require('./routes/auth') },
  { path: '/api/courses', handler: require('./routes/courses') },
  { path: '/api/tests', handler: require('./routes/tests') },
  { path: '/api/feedback', handler: require('./routes/feedback') },
  { path: '/api/test-submissions', handler: require('./routes/testSubmissions') },
  { path: '/api/assignment-submissions', handler: require('./routes/assignmentSubmissions') },
  { path: '/api/video-progress', handler: require('./routes/videoProgress') },
];

routes.forEach(({ path, handler }) => {
  console.log(`Registering routes for ${path}`);
  try {
    app.use(path, handler);
  } catch (err) {
    console.error(`Error registering routes for ${path}:`, err.message);
    throw err; // Re-throw to stop the server and catch the issue
  }
});

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