const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');
const router = express.Router();

// Get feedback for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (user.role === 'student' && !course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not enrolled in this course' });
    }
    if (user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not your course' });
    }

    const feedback = await Feedback.find({ course: req.params.courseId })
      .populate('student', 'name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Submit feedback (students only)
router.post('/course/:courseId', auth, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can submit feedback' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not enrolled in this course' });
    }

    const existingFeedback = await Feedback.findOne({
      course: req.params.courseId,
      student: req.user.id,
    });
    if (existingFeedback) {
      return res.status(400).json({ msg: 'Feedback already submitted' });
    }

    const feedback = new Feedback({
      course: req.params.courseId,
      student: req.user.id,
      rating,
      comment,
    });

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error('Feedback submit error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;