import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { deleteUserRelatedData } from '../utils/paperCleanup.js';
import { syncUserPoints } from '../utils/points.js';
// Student ID validation removed; field is no longer used.

function isPresent(value) {
  return value !== undefined && value !== null;
}

function validateUniversity(value) {
  const university = String(value).trim().replace(/\s+/g, ' ');
  const words = university.split(' ').filter(Boolean);
  const hasLetters = /[a-z]/i.test(university);
  const hasUniversityWord = /\b(university|college|institute|academy|school|đại học|dai hoc|trường|truong|fpt|hutech|rmit)\b/i.test(university);

  if (university.length < 5 || !hasLetters) {
    return 'Please enter a valid university name';
  }

  if (!/^[a-z0-9\s.'&\-À-ỹ]+$/i.test(university)) {
    return 'University name contains invalid characters';
  }

  if (words.length < 2 && !hasUniversityWord) {
    return 'Please enter the full university name';
  }

  return '';
}

function validateFullName(value) {
  const fullName = String(value).trim().replace(/\s+/g, ' ');
  const words = fullName.split(' ').filter(Boolean);

  if (fullName.length < 4 || words.length < 2 || !/[a-zÀ-ỹ]/i.test(fullName)) {
    return 'Please enter your full name';
  }

  if (!/^[a-z\s.'-À-ỹ]+$/i.test(fullName)) {
    return 'Full name contains invalid characters';
  }

  return '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export async function register(req, res) {
  const { fullName, university, email, password, confirmPassword } = req.body;

  if (!fullName || !university || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const fullNameError = validateFullName(fullName);
  if (fullNameError) {
    return res.status(400).json({ message: fullNameError });
  }

  const universityError = validateUniversity(university);
  if (universityError) {
    return res.status(400).json({ message: universityError });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const existingUser = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: String(fullName).trim().replace(/\s+/g, ' '),
    university: String(university).trim().replace(/\s+/g, ' '),
    // studentId removed
    email: String(email).trim(),
    passwordHash,
  });

  res.status(201).json({ user: user.toSafeObject(), token: signToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
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
  // studentId no longer supported in profile updates

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields provided' });
  }

  if (updates.fullName !== undefined && !updates.fullName) {
    return res.status(400).json({ message: 'Full name is required' });
  }

  if (updates.fullName !== undefined) {
    const fullNameError = validateFullName(updates.fullName);
    if (fullNameError) {
      return res.status(400).json({ message: fullNameError });
    }
    updates.fullName = updates.fullName.replace(/\s+/g, ' ');
  }

  if (updates.university !== undefined && !updates.university) {
    return res.status(400).json({ message: 'University is required' });
  }

  if (updates.university !== undefined) {
    const universityError = validateUniversity(updates.university);
    if (universityError) {
      return res.status(400).json({ message: universityError });
    }
    updates.university = updates.university.replace(/\s+/g, ' ');
  }

  // studentId removed — no further validation

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ user: user.toSafeObject() });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  if (isPresent(confirmPassword) && newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ message: 'Invalid access token' });
  }

  const ok = await user.comparePassword(currentPassword);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid current password' });
  }

  if (await user.comparePassword(newPassword)) {
    return res.status(400).json({ message: 'New password must be different from current password' });
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

  const affectedUserIds = await deleteUserRelatedData(user._id);
  await User.findByIdAndDelete(user._id);
  await Promise.all(affectedUserIds.map((userId) => syncUserPoints(userId)));

  res.json({ message: 'Account deleted' });
}
