const express = require('express');
const auth = require('../middleware/auth');
const VideoProgress = require('../models/VideoProgress');
const Course = require('../models/Course');
const User = require('../models/User'); // Add this import
const router = express.Router();

// Get video progress for a student in a course
router.get('/:courseId', auth, async (req, res) => {
  try {
    let userRole = req.user.role;
    if (!userRole) {
      // Fetch role from the database if not in the JWT
      const user = await User.findById(req.user.id).select('role');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      userRole = user.role;
    }

    if (userRole !== 'student') {
      return res.status(403).json({ msg: 'Only students can view video progress' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    const progress = await VideoProgress.find({
      student: req.user.id,
      course: req.params.courseId,
    });

    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Mark a video as watched
router.post('/:courseId/:videoIndex', auth, async (req, res) => {
  try {
    let userRole = req.user.role;
    if (!userRole) {
      // Fetch role from the database if not in the JWT
      const user = await User.findById(req.user.id).select('role');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      userRole = user.role;
    }

    if (userRole !== 'student') {
      return res.status(403).json({ msg: 'Only students can mark videos as watched' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    const videoIndex = parseInt(req.params.videoIndex, 10);
    if (isNaN(videoIndex) || videoIndex < 0 || videoIndex >= (course.videos?.length || 0)) {
      return res.status(400).json({ msg: 'Invalid video index' });
    }

    let progress = await VideoProgress.findOne({
      student: req.user.id,
      course: req.params.courseId,
      videoIndex: videoIndex,
    });

    if (!progress) {
      progress = new VideoProgress({
        student: req.user.id,
        course: req.params.courseId,
        videoIndex: videoIndex,
        watched: true,
        watchedAt: new Date(),
      });
    } else {
      progress.watched = true;
      progress.watchedAt = new Date();
    }

    await progress.save();
    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;