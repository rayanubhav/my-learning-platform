const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: String, required: true },
  response: { type: String, required: true },
  videoUrl: { type: String },
  wordUrl: { type: String },
  pdfUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);