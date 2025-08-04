'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './ForgotPass.css';

const ForgotPass = () => {
  const router = useRouter();
  const apiIp = process.env.NEXT_PUBLIC_API_URL;

  // form state
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // show/hide toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const res = await fetch(`${apiIp}verifier/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('OTP has been sent to your email.');
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${apiIp}verifier/resetPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Password reset successful! Redirecting to login…');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="forgotpass-container">
      <form
        onSubmit={step === 1 ? handleSendOtp : handleReset}
        className="forgotpass-form"
      >
        <h2 className="forgotpass-title">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </h2>

        {step === 1 ? (
          <>
            <p className="forgotpass-subtitle">
              Enter your email to receive an OTP.
            </p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="forgotpass-input"
              autoComplete="off"
            />
          </>
        ) : (
          <>
            <p className="forgotpass-subtitle">
              Enter the OTP and your new password.
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="forgotpass-input"
              autoComplete="off"
            />

            {/* New Password */}
            <div className="password-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="forgotpass-input"
              />
              <span
                className="password-toggle"
                onClick={() => setShowNewPassword(v => !v)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Confirm Password */}
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="forgotpass-input"
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(v => !v)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </>
        )}

        {error && <p className="error-message1">{error}</p>}
        {successMsg && <p className="success-message1">{successMsg}</p>}

        <button type="submit" className="forgotpass-button">
          {step === 1 ? 'Send OTP' : 'Reset Password'}
        </button>

        <p className="back-to-login">
          <span
            onClick={() => router.push('/')}
            className="login-redirect-link"
          >
            Back to Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default ForgotPass;
