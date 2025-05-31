const express = require('express');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Test = require('../models/Test');
const { generateTest } = require('../geminiApi');
const router = express.Router();

// Create a test manually (teachers only)
router.post('/', auth, async (req, res) => {
  const { courseId, title, description, dueDate } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher' && user.role !== 'Teacher') {
      console.log('Test creation denied for user:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Only teachers can create tests' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found for test creation:', courseId);
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (course.teacher.toString() !== req.user.id) {
      console.log('Test creation denied: Not owner. User:', user.email, 'Course teacher:', course.teacher);
      return res.status(403).json({ msg: 'Not your course' });
    }

    const test = new Test({
      course: courseId,
      teacher: req.user.id,
      title,
      description,
      dueDate,
    });

    await test.save();
    console.log('Test created manually for course:', course.title, test);
    res.json(test);
  } catch (err) {
    console.error('Test creation error:', err.message, err.stack);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// Generate a test for a course (teachers only)
router.post('/:courseId/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher' && user.role !== 'Teacher') {
      console.log('Test generation denied for user:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Only teachers can generate tests' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      console.log('Course not found for test generation:', req.params.courseId);
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (course.teacher.toString() !== req.user.id) {
      console.log('Test generation denied: Not owner. User:', user.email, 'Course teacher:', course.teacher);
      return res.status(403).json({ msg: 'Not your course' });
    }

    const testData = await generateTest(course.title, course.description);
    const test = new Test({
      course: course._id,
      teacher: req.user.id,
      title: `Test for ${course.title}`,
      questions: testData.questions,
    });

    await test.save();
    console.log('Test generated for course:', course.title, test);
    res.json(test);
  } catch (err) {
    console.error('Test generation error:', err.message, err.stack);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// Get tests for the user (teachers: created tests, students: tests in enrolled courses)
router.get('/my-tests', auth, async (req, res) => {
  console.log('Received request for GET /my-tests', { userId: req.user?.id, token: req.header('x-auth-token') });
  try {
    const user = await User.findById(req.user.id);
    console.log('User fetched:', user);
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    let tests;
    if (user.role === 'teacher' || user.role === 'Teacher') {
      tests = await Test.find({ teacher: req.user.id })
        .populate('course', 'title')
        .populate('teacher', 'name')
        .populate('submissions.student', 'name');
      console.log('Tests fetched for teacher:', user.email, tests);
    } else if (user.role === 'student' || user.role === 'Student') {
      const enrolledCourses = await Course.find({ enrolledStudents: req.user.id });
      const courseIds = enrolledCourses.map(course => course._id);
      tests = await Test.find({ course: { $in: courseIds } })
        .populate('course', 'title')
        .populate('teacher', 'name')
        .populate('submissions.student', 'name');
      console.log('Tests fetched for student:', user.email, tests);
    } else {
      console.log('My-tests fetch denied for user: Invalid role. User:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Invalid role' });
    }

    res.json(tests);
  } catch (err) {
    console.error('My-tests fetch error:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// Get all tests for a course
router.get('/:courseId', auth, async (req, res) => {
  try {
    const tests = await Test.find({ course: req.params.courseId })
      .populate('course', 'title')
      .populate('teacher', 'name')
      .populate('submissions.student', 'name');
    console.log('Tests fetched for course:', req.params.courseId, tests);
    res.json(tests);
  } catch (err) {
    console.error('Tests fetch error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid course ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single test by ID
router.get('/test/:testId', auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId)
      .populate('course', 'title')
      .populate('teacher', 'name')
      .populate('submissions.student', 'name');
    if (!test) {
      console.log('Test not found:', req.params.testId);
      return res.status(404).json({ msg: 'Test not found' });
    }
    console.log('Test fetched:', test);
    res.json(test);
  } catch (err) {
    console.error('Test fetch error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid test ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Submit test answers (students only)
router.post('/:testId/submit', auth, async (req, res) => {
  const { answers } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'student' && user.role !== 'Student') {
      console.log('Test submission denied for user:', user.email, 'Role:', user.role);
      return res.status(403).json({ msg: 'Only students can submit tests' });
    }

    const test = await Test.findById(req.params.testId);
    if (!test) {
      console.log('Test not found for submission:', req.params.testId);
      return res.status(404).json({ msg: 'Test not found' });
    }

    const course = await Course.findById(test.course);
    if (!course.enrolledStudents.includes(req.user.id)) {
      console.log('Test submission denied: Not enrolled. User:', user.email, 'Course:', course.title);
      return res.status(403).json({ msg: 'You are not enrolled in this course' });
    }

    const existingSubmission = test.submissions.find(sub => sub.student.toString() === req.user.id);
    if (existingSubmission) {
      console.log('Test already submitted by user:', user.email, 'Test:', test.title);
      return res.status(400).json({ msg: 'You have already submitted this test' });
    }

    if (test.dueDate && new Date(test.dueDate) < new Date()) {
      console.log('Test submission denied: Past due date. User:', user.email, 'Test:', test.title);
      return res.status(403).json({ msg: 'Test submission is past due' });
    }

    let score = 0;
    if (test.questions.length > 0) {
      const correctAnswers = test.questions.map(q => q.correctAnswer);
      for (let i = 0; i < correctAnswers.length; i++) {
        if (answers[i] === correctAnswers[i]) {
          score++;
        }
      }
    }

    test.submissions.push({
      student: req.user.id,
      answers: test.questions.length > 0 ? answers : [],
      score,
    });
    await test.save();

    console.log('Test submitted by user:', user.email, 'Test:', test.title, 'Score:', score);
    res.json({ score, total: test.questions.length });
  } catch (err) {
    console.error('Test submission error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid test ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Log suspicious activity during a test
router.post('/log-suspicious-activity', auth, async (req, res) => {
  const { testId, userId, activity } = req.body;

  try {
    const test = await Test.findById(testId);
    if (!test) {
      console.log('Test not found for logging suspicious activity:', testId);
      return res.status(404).json({ msg: 'Test not found' });
    }

    test.suspiciousActivities = test.suspiciousActivities || [];
    test.suspiciousActivities.push({
      userId,
      activity,
      timestamp: new Date(),
    });

    await test.save();
    console.log('Suspicious activity logged:', { testId, userId, activity });
    res.status(200).json({ msg: 'Suspicious activity logged' });
  } catch (err) {
    console.error('Error logging suspicious activity:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;