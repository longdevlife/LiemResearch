import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Paper } from '../models/Paper.js';
import { signToken } from '../utils/token.js';

function isPresent(value) {
  return value !== undefined && value !== null;
}

export async function register(req, res) {
  const { fullName, university, studentId, email, password, confirmPassword } = req.body;

  if (!fullName || !university || !studentId || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, university, studentId, email, passwordHash });

  res.status(201).json({ user: user.toSafeObject(), token: signToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ message: 'Your account has been banned' });
  }

  res.json({ user: user.toSafeObject(), token: signToken(user) });
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

export async function updateMe(req, res) {
  const updates = {};

  if (isPresent(req.body.fullName)) updates.fullName = String(req.body.fullName).trim();
  if (isPresent(req.body.university)) updates.university = String(req.body.university).trim();
  if (isPresent(req.body.studentId)) updates.studentId = String(req.body.studentId).trim();

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields provided' });
  }

  if (updates.fullName !== undefined && !updates.fullName) {
    return res.status(400).json({ message: 'Full name is required' });
  }

  if (updates.university !== undefined && !updates.university) {
    return res.status(400).json({ message: 'University is required' });
  }

  if (updates.studentId !== undefined && !updates.studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ user: user.toSafeObject() });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ message: 'Invalid access token' });
  }

  const ok = await user.comparePassword(currentPassword);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid current password' });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();

  res.json({ message: 'Password updated', token: signToken(user) });
}

export async function deleteMe(req, res) {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ message: 'password is required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ message: 'Invalid access token' });
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Papers require requestedBy, so delete the user's own requests as part of account deletion.
  await Paper.deleteMany({ requestedBy: user._id });

  await User.findByIdAndDelete(user._id);

  res.json({ message: 'Account deleted' });
}
