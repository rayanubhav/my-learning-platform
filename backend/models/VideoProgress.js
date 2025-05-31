const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  videoIndex: { type: Number, required: true }, // Index of the video in the course.videos array
  watched: { type: Boolean, default: false },
  watchedAt: { type: Date },
});

module.exports = mongoose.model('VideoProgress', videoProgressSchema);