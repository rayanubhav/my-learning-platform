const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user & get token
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if all required fields are provided
    if (!name || !email || !password || !role) {
      console.log('Registration failed: Missing fields', { name, email, password, role });
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Validate role
    if (!['student', 'teacher'].includes(role.toLowerCase())) {
      console.log('Registration failed: Invalid role', { role });
      return res.status(400).json({ msg: 'Role must be either student or teacher' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('Registration failed: User already exists for email:', email);
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role.toLowerCase(),
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.role, // Include role in the payload
      },
    };

    // Sign and return token
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        console.error('JWT signing error during registration:', err);
        throw err;
      }
      console.log('Registration successful, token generated for user:', email);
      res.json({ token, user: { id: user._id, name, email, role: user.role } });
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch for email:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role, // Include role in the payload
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        console.error('JWT signing error:', err);
        throw err;
      }
      console.log('Login successful, token generated for user:', email);
      res.json({ token });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User data fetched for ID:', req.user.id);
    res.json(user);
  } catch (err) {
    console.error('Fetch user error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;