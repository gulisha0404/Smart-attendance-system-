const mongoose = require('mongoose');

// This is the "shape" of each user in MongoDB
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // 👇 NEW: role (student or teacher)
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  },

  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // student profile data
  profile: {
  fullName: { type: String, default: '' },
  enrollmentNo: { type: String, default: '' },

  semester: { type: String, default: '' },
  department: { type: String, default: '' },
  cgpa: { type: Number, default: null },

  skills: { type: [String], default: [] },

  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },

  // NEW EDUCATION SECTION
  ssc: {
    school: { type: String, default: '' },
    board: { type: String, default: '' },
    percentage: { type: String, default: '' },
    year: { type: String, default: '' }
  },

  hsc: {
    school: { type: String, default: '' },
    board: { type: String, default: '' },
    percentage: { type: String, default: '' },
    year: { type: String, default: '' }
  }
},

  achievements: [
    {
      title: { type: String, required: true },
      type: { type: String, default: 'Academic' },
      dateCompleted: { type: Date },
      certificatePath: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }
  ]
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);
