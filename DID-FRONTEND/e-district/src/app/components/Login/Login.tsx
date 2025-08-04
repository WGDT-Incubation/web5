'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';
import loginImage from '../../../../public/images/otp-security 1.svg';
import logoMin from '../../../../public/images/WF-Logo.svg';

const Login = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; apiError?: string }>({});
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    try {
      const response = await fetch(`${apiIp}superAdmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Email: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.AuthToken);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('loginTime', Date.now().toString());

        router.push('/addIssuer');
      } else {
        setErrors({ apiError: data.message || 'Invalid credentials' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ apiError: 'Server error. Please try again later.' });
    }
  };

  // const handleSignUpRedirect = () => {
  //   router.push('/signup');
  // };

  return (
    <div className="login-container">
      <div className="login-left-div">
        <Image src={loginImage} alt="icon" />
      </div>
      <div className="login-right-div">
        <form onSubmit={handleLogin} className="form-box">
          <Image src={logoMin} alt="logo" className="logo-image" />
          <h2 className="login-title">E-District</h2>
          <p className="login-subtitle">
            Welcome to Praman Patra Mitra – Your Gateway to Trusted, Verified Documentation.
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          {errors.email && <p className="error-message1">{errors.email}</p>}

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <span className="password-toggle" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="error-message1">{errors.password}</p>}

          {errors.apiError && <p className="error-message1">{errors.apiError}</p>}

          {/* <div className="login-forgot">
            <span onClick={() => router.push('/forgotPass')}>Forgot your password?</span>
          </div> */}

          <button type="submit" className="login-button">
            Log in
          </button>

          {/* <p className="login-signup-redirect">
            Don’t have an account?{' '}
            <span onClick={handleSignUpRedirect} className="login-signup-link">
              Signup
            </span>
          </p> */}
        </form>
      </div>
    </div>
  );
};

export default Login;
