const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Test = require('../models/Test');
const TestSubmission = require('../models/TestSubmission');
const router = express.Router();

// Get submissions for a test
router.get('/test/:testId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const test = await Test.findById(req.params.testId).populate('teacher');
    if (!test) {
      return res.status(404).json({ msg: 'Test not found' });
    }
    if (user.role === 'student' && !test.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not enrolled in this test' });
    }
    if (user.role === 'teacher' && test.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not your test' });
    }

    const submissions = await TestSubmission.find({ test: req.params.testId })
      .populate('student', 'name');
    console.log('Fetched submissions for test:', req.params.testId, 'Count:', submissions.length);
    res.json(submissions);
  } catch (err) {
    console.error('Submission fetch error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Submit answers for a test (students only)
router.post('/test/:testId', auth, async (req, res) => {
  const { answers } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can submit tests' });
    }

    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ msg: 'Test not found' });
    }
    if (!test.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not enrolled in this test' });
    }

    const existingSubmission = await TestSubmission.findOne({
      test: req.params.testId,
      student: req.user.id,
    });
    if (existingSubmission) {
      return res.status(400).json({ msg: 'Test already submitted' });
    }

    const submission = new TestSubmission({
      test: req.params.testId,
      student: req.user.id,
      answers,
    });

    await submission.save();
    console.log('Submitted test for test:', req.params.testId);
    res.json(submission);
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Grade a submission (teachers only)
router.put('/grade/:submissionId', auth, async (req, res) => {
  const { grade } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher') {
      return res.status(403).json({ msg: 'Only teachers can grade submissions' });
    }

    const submission = await TestSubmission.findById(req.params.submissionId).populate('test');
    if (!submission) {
      return res.status(404).json({ msg: 'Submission not found' });
    }
    if (submission.test.teacher.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not your test' });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({ msg: 'Grade must be between 0 and 100' });
    }

    submission.grade = grade;
    await submission.save();
    console.log('Graded submission:', submission._id, 'Grade:', grade);
    res.json(submission);
  } catch (err) {
    console.error('Grading error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;