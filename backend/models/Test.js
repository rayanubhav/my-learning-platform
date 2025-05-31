const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: String, required: true }],
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const suspiciousActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const testSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  questions: { type: [questionSchema], default: [] },
  submissions: { type: [submissionSchema], default: [] },
  suspiciousActivities: { type: [suspiciousActivitySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Test', testSchema);