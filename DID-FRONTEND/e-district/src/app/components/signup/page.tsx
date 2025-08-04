'use client';

import React, { useState } from 'react';
import './signup.css';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const SignUp = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const apiIp= process.env.NEXT_PUBLIC_API_URL
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
  
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
  
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
  
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(''); 
  
    if (!validate()) return;
  
    const signUpData = {
      Email: email,
      password: password,
    };
  
    try {
      const res = await fetch(`${apiIp}superAdmin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signUpData),
      });
  
      const responseData = await res.json();
  
      if (!res.ok) {
        console.error('Failed to sign up:', responseData);
        setApiError(responseData.error || 'Failed to sign up. Please try again.');
        return;
      }
  
      console.log('User registered:', responseData);
      setApiError('');
      router.push('/');
    } catch (error) {
      console.error('Error during sign-up:', error);
      setApiError('An error occurred while signing up. Please try again.');
    }
  };

  const handleLoginRedirect = () => {
    router.push('/');
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSignUp} className="signup-form-box">
        <h2 className="signup-title">Sign Up</h2>
        <p className="signup-subtitle">Create your new account</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
        />
        {errors.email && <p className="error-message1">{errors.email}</p>}

        <div className="signup-password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="signup-input"
          />
          <span
            className="signup-password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {errors.password && <p className="error-message1">{errors.password}</p>}

        <div className="signup-password-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="signup-input"
          />
          <span
            className="signup-password-toggle"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {errors.confirmPassword && (
          <p className="error-message1">{errors.confirmPassword}</p>
        )}
{apiError && <p className="error-message1">{apiError}</p>}
        <button type="submit" className="signup-button">
          Sign Up
        </button>

        <p className="signup-login-redirect">
          Already have an account?{' '}
          <span onClick={handleLoginRedirect} className="signup-login-link">
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
