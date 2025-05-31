const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const router = express.Router();

// Get submissions for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      console.log('Course not found for assignment submissions:', req.params.courseId);
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (user.role === 'student' && !course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not enrolled in this course' });
    }
    if (user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not your course' });
    }

    const submissions = await AssignmentSubmission.find({ course: req.params.courseId })
      .populate('student', 'name');
    console.log('Fetched assignment submissions for course:', req.params.courseId, 'Count:', submissions.length);
    res.json(submissions);
  } catch (err) {
    console.error('Assignment submission fetch error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Submit an assignment (students only)
router.post('/course/:courseId', auth, async (req, res) => {
  const { assignment, response, videoUrl, wordUrl, pdfUrl } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can submit assignments' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not enrolled in this course' });
    }
    if (!course.assignments.includes(assignment)) {
      return res.status(400).json({ msg: 'Invalid assignment' });
    }

    const existingSubmission = await AssignmentSubmission.findOne({
      course: req.params.courseId,
      student: req.user.id,
      assignment,
    });
    if (existingSubmission) {
      return res.status(400).json({ msg: 'Assignment already submitted' });
    }

    const submission = new AssignmentSubmission({
      course: req.params.courseId,
      student: req.user.id,
      assignment,
      response,
      videoUrl,
      wordUrl,
      pdfUrl,
    });

    await submission.save();
    console.log('Submitted assignment for course:', req.params.courseId);
    res.json(submission);
  } catch (err) {
    console.error('Assignment submission error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;