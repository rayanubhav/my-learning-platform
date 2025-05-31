const mongoose = require('mongoose');

const testSubmissionSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ question: String, answer: String }],
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, min: 0, max: 100 },
});

module.exports = mongoose.model('TestSubmission', testSubmissionSchema);