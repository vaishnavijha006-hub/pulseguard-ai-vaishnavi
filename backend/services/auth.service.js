// backend/services/auth.service.js
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
require('dotenv').config();

// Helper: send email (placeholder – configure real SMTP in .env)
const sendEmail = async ({ to, subject, html }) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });

    await transporter.sendMail({
      from: `"PulseGuard AI" <${process.env.SMTP_FROM || 'no-reply@pulseguard.ai'}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.warn('Email sending failed (nodemailer not available or misconfigured):', error.message);
    // Don't throw - email is non-critical for auth flow
  }
};

/* ------------------------------------------------------------------
   Register a new user
   ------------------------------------------------------------------ */
const register = asyncHandler(async (data) => {
  const { name, email, password, role, walletAddress } = data;

  if (!name || !email || !password) {
    const err = new Error('Name, email and password are required');
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('User with this email already exists');
    err.status = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role, walletAddress }); // pre‑save hook hashes
  const token = user.generateAuthToken();

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;

  return { user: userObj, token };
});

/* ------------------------------------------------------------------
   Login existing user
   ------------------------------------------------------------------ */
const login = asyncHandler(async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  user.lastLogin = Date.now();
  await user.save();

  const token = user.generateAuthToken();

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;

  return { user: userObj, token };
});

/* ------------------------------------------------------------------
   Logout – stateless when using JWT header, placeholder for cookie case
   ------------------------------------------------------------------ */
const logout = asyncHandler(async () => {
  // If JWT stored in HttpOnly cookie, clear it in controller
  return { message: 'Logged out successfully' };
});

/* ------------------------------------------------------------------
   Get current authenticated user
   ------------------------------------------------------------------ */
const getMe = asyncHandler(async (userId) => {
  const user = await User.findById(userId).select('-password -__v -resetPasswordToken -resetPasswordExpire');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
});

/* ------------------------------------------------------------------
   Forgot password – send reset email with token
   ------------------------------------------------------------------ */
const forgotPassword = asyncHandler(async (email, reqOrigin) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('User with this email does not exist');
    err.status = 404;
    throw err;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${reqOrigin}/api/auth/reset-password/${resetToken}`;
  const message = `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p>`;

  try {
    await sendEmail({ to: user.email, subject: 'PulseGuard AI – Password Reset', html: message });
    return { message: 'Password reset email sent' };
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    const err = new Error('Email could not be sent');
    err.status = 500;
    throw err;
  }
});

/* ------------------------------------------------------------------
   Reset password – verify token and set new password
   ------------------------------------------------------------------ */
const resetPassword = asyncHandler(async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Invalid or expired password reset token');
    err.status = 400;
    throw err;
  }

  user.password = newPassword; // pre‑save hook will hash it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { message: 'Password has been reset successfully' };
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
