// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');             // 👈 NEW
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const User = require('./models/User');

const app = express();

// ====== ENV VARIABLES ======
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret-key-change-this';

// ====== FILE UPLOAD (PDF CERTIFICATES) ======
const uploadDir = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // .pdf
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = Date.now();
    cb(null, base + '_' + unique + ext);
  }
});

function pdfFileFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'));
  }
}

const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// serve uploaded files statically: /uploads/filename.pdf
app.use('/uploads', express.static(uploadDir));

// helper to delete a stored certificate file from disk
function deleteCertificateFile(certificatePath) {
  try {
    if (!certificatePath) return;

    // certificatePath is like "/uploads/filename.pdf"
    const prefix = '/uploads/';
    let fileName = certificatePath;

    if (certificatePath.startsWith(prefix)) {
      fileName = certificatePath.slice(prefix.length); // "filename.pdf"
    }

    const fullPath = path.join(uploadDir, fileName);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to delete certificate file:', err.message);
      }
    });
  } catch (e) {
    console.error('deleteCertificateFile error:', e.message);
  }
}



// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());

// Serve frontend files from the project root (one level above backend)
app.use(express.static(path.join(__dirname, '..')));

// ====== CONNECT TO MONGODB ======
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected:', MONGO_URI);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}
connectDB();

// ====== SIMPLE HEALTH CHECK ======
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, msg: 'pong from backend' });
});

// ====== AUTH MIDDLEWARE (CHECK JWT TOKEN) ======
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'No token found. Please login again.'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET); // { sub: userId, email: ... }
    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({
      ok: false,
      error: 'Invalid or expired token.'
    });
  }
}

// ===================================================
// AUTH ROUTES: REGISTER + LOGIN
// ===================================================

// POST /api/register  -> create new user
// POST /api/register  -> create new user
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Invalid email.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: 'Password must be at least 6 characters.'
      });
    }

    // only allow two roles, default student
    let safeRole = 'student';
    if (role === 'teacher') safeRole = 'teacher';

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: safeRole
    });

    await user.save();

    return res.json({ ok: true, msg: 'User registered successfully.', role: safeRole });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ ok: false, error: 'Server error during registration.' });
  }
});


// POST /api/login  -> login and get token
// POST /api/login  -> login and get token
app.post('/api/login', async (req, res) => {
  try {
    const {
      email,
      password,
      enteredCaptcha,
      shownCaptcha,
      role
    } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }
    if (!password) {
      return res.status(400).json({ ok: false, error: 'Password required' });
    }

    if (!enteredCaptcha || !shownCaptcha) {
      return res.status(400).json({ ok: false, error: 'Missing captcha values' });
    }
    if (enteredCaptcha.trim() !== shownCaptcha.trim()) {
      return res.status(401).json({ ok: false, error: 'Captcha mismatch' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        ok: false,
        error: 'User not found or invalid user record. Please register again.'
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, error: 'Incorrect password' });
    }

    // role verification (important)
    if (role && user.role !== role) {
    return res.status(403).json({
        ok: false,
        error: `This account is registered as ${user.role}, not ${role}.`
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role || 'student' },
      JWT_SECRET,
      { expiresIn: '6h' }
    );

    return res.json({
      ok: true,
      msg: 'Login successful',
      token,
      role: user.role || 'student',
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: 'Server error during login.' });
  }
});


// ===================================================
// PROFILE ROUTES (USE profile FIELD IN User.js)
// ===================================================

// GET /api/profile  -> get logged in student's profile
app.get('/api/profile', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('email profile');
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    return res.json({
      ok: true,
      email: user.email,
      profile: user.profile || {}
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server error while loading profile'
    });
  }
});

// POST /api/profile  -> save / update profile for logged in student
app.post('/api/profile', authRequired, async (req, res) => {
  try {
    const {
      fullName,
      enrollmentNo,
      semester,
      department,
      cgpa,
      skills,
      github,
      linkedin,
      portfolio,
      ssc,
      hsc
    } = req.body || {};

    let skillsArray = [];
    if (typeof skills === 'string' && skills.trim().length > 0) {
      skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(skills)) {
      skillsArray = skills;
    }

    const update = {
      profile: {
        fullName: fullName || '',
        enrollmentNo: enrollmentNo || '',
        semester: semester || '',
        department: department || '',
        cgpa: cgpa === '' || cgpa == null ? null : Number(cgpa),
        skills: skillsArray,
        github: github || '',
        linkedin: linkedin || '',
        portfolio: portfolio || '',
        ssc: ssc || {},
        hsc: hsc || {}
      }
    };

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      update,
      { new: true }
    ).select('email profile');

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    return res.json({
      ok: true,
      profile: user.profile
    });
  } catch (err) {
    console.error('Profile SAVE error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server error while saving profile'
    });
  }
});

// ===================================================
// ACHIEVEMENTS ROUTES
// ===================================================

// GET /api/achievements -> list all achievements of logged-in user
app.get('/api/achievements', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('achievements');
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    // sort newest first by createdAt
    const achievements = (user.achievements || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({ ok: true, achievements });
  } catch (err) {
    console.error('Achievements GET error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server error while loading achievements'
    });
  }
});

// POST /api/achievements -> add one achievement (with optional PDF)
app.post('/api/achievements', authRequired, upload.single('certificate'), async (req, res) => {
  try {
    const { title, type, dateCompleted } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ ok: false, error: 'Achievement title is required.' });
    }

    const allowedTypes = [
      'Academic',
      'Non Academic',
      'Cultural',
      'Certification',
      'Other'
    ];
    const safeType = allowedTypes.includes(type) ? type : 'Academic';

    let parsedDate = null;
    if (dateCompleted) {
      const d = new Date(dateCompleted);
      if (!isNaN(d.getTime())) parsedDate = d;
    }

    // if a file was uploaded, multer put it in req.file
    let certificatePath = '';
    if (req.file) {
      certificatePath = '/uploads/' + req.file.filename; // URL path
    }

    const achievement = {
      title: title.trim(),
      type: safeType,
      dateCompleted: parsedDate,
      certificatePath
    };

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $push: { achievements: achievement } },
      { new: true }
    ).select('achievements');

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const latest = user.achievements[user.achievements.length - 1];

    return res.json({ ok: true, achievement: latest });
  } catch (err) {
    console.error('Achievements POST error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Server error while saving achievement'
    });
  }
});

// PATCH /api/achievements/:id -> update an achievement (and certificate)
app.patch('/api/achievements/:id', authRequired, upload.single('certificate'), async (req, res) => {
  try {
    const achievementId = req.params.id;
    const { title, type, dateCompleted, removeCertificate } = req.body || {};

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const ach = user.achievements.id(achievementId);
    if (!ach) {
      return res.status(404).json({ ok: false, error: 'Achievement not found' });
    }

    // update title
    if (title && title.trim()) {
      ach.title = title.trim();
    }

    // update type (only allowed values)
    const allowedTypes = ['Academic', 'Non Academic', 'Cultural', 'Certification', 'Other'];
    if (type && allowedTypes.includes(type)) {
      ach.type = type;
    }

    // update date
    if (dateCompleted !== undefined) {
      if (dateCompleted) {
        const d = new Date(dateCompleted);
        if (!isNaN(d.getTime())) {
          ach.dateCompleted = d;
        }
      } else {
        ach.dateCompleted = null;
      }
    }

    // remove existing certificate if requested
    if (removeCertificate === 'true') {
      if (ach.certificatePath) {
        deleteCertificateFile(ach.certificatePath);
      }
      ach.certificatePath = '';
    }

    // if new file uploaded, replace old one
    if (req.file) {
      if (ach.certificatePath) {
        deleteCertificateFile(ach.certificatePath);
      }
      ach.certificatePath = '/uploads/' + req.file.filename;
    }

    await user.save();

    return res.json({ ok: true, achievement: ach });
  } catch (err) {
    console.error('Achievements PATCH error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Server error while updating achievement'
    });
  }
});

// DELETE /api/achievements/:id -> delete achievement (and its certificate)
app.delete('/api/achievements/:id', authRequired, async (req, res) => {
  try {
    const achievementId = req.params.id;

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const ach = user.achievements.id(achievementId);
    if (!ach) {
      return res.status(404).json({ ok: false, error: 'Achievement not found' });
    }

    if (ach.certificatePath) {
      deleteCertificateFile(ach.certificatePath);
    }

    ach.deleteOne(); // remove from array
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error('Achievements DELETE error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Server error while deleting achievement'
    });
  }
});

// teacher-only protection middleware
function teacherOnly(req, res, next) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({
      ok: false,
      error: 'Teacher access only'
    });
  }
  next();
}
// GET /api/teacher/achievements -> all students achievements
app.get('/api/teacher/achievements', authRequired, teacherOnly, async (req, res) => {
  try {
    const users = await User.find({}, 'email profile.fullName achievements');

    const allAchievements = [];

    users.forEach(user => {
      const name = user.profile?.fullName || 'Unnamed Student';

      (user.achievements || []).forEach(ach => {
        allAchievements.push({
          studentEmail: user.email,
          studentName: name,
          title: ach.title,
          type: ach.type,
          dateCompleted: ach.dateCompleted,
          certificatePath: ach.certificatePath
        });
      });
    });

    // newest first
    allAchievements.sort((a, b) =>
      new Date(b.dateCompleted || 0) - new Date(a.dateCompleted || 0)
    );

    res.json({ ok: true, achievements: allAchievements });
  } catch (err) {
    console.error('Teacher achievements error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ====== FALLBACK: SERVE index.html FOR ANY OTHER ROUTE ======
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
