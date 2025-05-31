const express = require('express');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const router = express.Router();

// Get user's enrolled courses (students) or created courses (teachers)
router.get('/my-courses', auth, async (req, res) => {
  try {
    console.log('Received token:', req.header('x-auth-token'));
    console.log('Fetching my-courses for user ID:', req.user.id);
    if (!req.user || !req.user.id) {
      console.log('No user or user ID in request:', req.user);
      return res.status(401).json({ msg: 'Authentication failed: No user ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.log('Invalid user ID format:', req.user.id);
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }

    const user = await User.findById(req.user.id).select('email role');
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('User details:', { email: user.email, role: user.role });

    let courses = [];
    if (user.role === 'student' || user.role === 'Student') {
      console.log('Fetching enrolled courses for student:', user.email);
      const studentCourses = await Course.find({ enrolledStudents: req.user.id }).lean();
      console.log('Student courses found:', studentCourses);
      if (studentCourses.length > 0) {
        courses = await Course.find({ enrolledStudents: req.user.id })
          .populate({ path: 'teacher', select: 'name', match: { _id: { $exists: true } } })
          .populate({ path: 'enrolledStudents', select: 'name', match: { _id: { $exists: true } } });
        courses = courses.filter(course => course.teacher !== null);
      }
    } else if (user.role === 'teacher' || user.role === 'Teacher') {
      console.log('Fetching created courses for teacher:', user.email);
      const teacherCourses = await Course.find({ teacher: req.user.id }).lean();
      console.log('Teacher courses found:', teacherCourses);
      if (teacherCourses.length > 0) {
        courses = await Course.find({ teacher: req.user.id })
          .populate({ path: 'teacher', select: 'name', match: { _id: { $exists: true } } })
          .populate({ path: 'enrolledStudents', select: 'name', match: { _id: { $exists: true } } });
        courses = courses.filter(course => course.teacher !== null);
      }
    } else {
      console.log('Invalid user role:', user.role);
      return res.status(400).json({ msg: `Invalid user role: ${user.role}` });
    }

    console.log('Courses fetched for user:', user.email, courses);
    res.json(courses || []);
  } catch (err) {
    console.error('My-courses error:', err.message, err.stack);
    if (err.kind === 'ObjectId') {
      console.log('Invalid ObjectId encountered:', err.value);
      return res.status(400).json({ msg: 'Invalid ObjectId in course data' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name')
      .populate('enrolledStudents', 'name');
    console.log('All courses fetched:', courses);
    res.json(courses);
  } catch (err) {
    console.error('Fetch all courses error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single course
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log('Fetching course ID:', courseId);
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('Invalid course ID:', courseId);
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    const course = await Course.findById(courseId)
      .populate('teacher', 'name')
      .populate('enrolledStudents', 'name');
    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ msg: 'Course not found' });
    }
    console.log('Course fetched:', course);
    res.json(course);
  } catch (err) {
    console.error('Course fetch error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create a course (teachers only)
router.post('/', auth, async (req, res) => {
  const { title, description, videos, assignments } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher' && user.role !== 'Teacher') {
      console.log('Course creation denied for user:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Only teachers can create courses' });
    }

    const course = new Course({
      title,
      description,
      teacher: req.user.id,
      videos: videos || [],
      assignments: assignments || [],
      enrolledStudents: [],
    });

    await course.save();
    console.log('Course created by user:', user.email, course);
    res.json(course);
  } catch (err) {
    console.error('Course creation error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update course content (teachers only)
router.put('/:courseId/content', auth, async (req, res) => {
  const { video, assignment } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher' && user.role !== 'Teacher') {
      console.log('Course update denied for user:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Only teachers can update course content' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      console.log('Course not found for update:', req.params.courseId);
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (course.teacher.toString() !== req.user.id) {
      console.log('Course update denied: Not owner. User:', user.email, 'Course teacher:', course.teacher);
      return res.status(403).json({ msg: 'Not your course' });
    }

    if (video) {
      course.videos.push(video);
    }
    if (assignment) {
      course.assignments.push(assignment);
    }

    await course.save();
    console.log('Course updated by user:', user.email, course);
    res.json(course);
  } catch (err) {
    console.error('Course update error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Enroll in a course (students only)
router.post('/enroll/:courseId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    console.log('Enroll user:', user.email, 'Course ID:', req.params.courseId);
    if (user.role !== 'student' && user.role !== 'Student') {
      console.log('Enrollment denied for user:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Only students can enroll in courses' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      console.log('Course not found for enrollment:', req.params.courseId);
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (course.enrolledStudents.includes(req.user.id)) {
      console.log('User already enrolled:', user.email, 'Course:', course.title);
      return res.status(400).json({ msg: 'Already enrolled' });
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();
    console.log('User enrolled:', user.email, 'Course:', course.title);

    const updatedCourse = await Course.findById(req.params.courseId)
      .populate('teacher', 'name')
      .populate('enrolledStudents', 'name');
    res.json(updatedCourse);
  } catch (err) {
    console.error('Enrollment error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;