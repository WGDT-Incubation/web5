'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';
import loginImage from '../../../../public/images/biometric-security 1.svg';
import logoMin from '../../../../public/images/WF-Logo.svg';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const apiIp= process.env.NEXT_PUBLIC_API_URL
  console.log("apiIp", apiIp)
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
  
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
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
    if (!validate()) return;

    const loginData = { email, password };

    try {
      const loginResponse = await fetch(`${apiIp}verifier/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        setErrors({
          email: errorData.error || 'Invalid credentials',
          password: errorData.error || 'Invalid credentials',
        });
        console.error('Login failed:', errorData);
        return;
      }

      const loginDataResponse = await loginResponse.json();
      console.log('Login successful:', loginDataResponse);

      const authToken = loginDataResponse.AuthToken;
      if (authToken) {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem("loginTime", Date.now().toString());
      } else {
        console.error('No AuthToken received from API');
        setErrors({ email: 'No AuthToken received from API' });
        return;
      }

      const verifierResponse = await fetch(`${apiIp}verifier/verifierLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!verifierResponse.ok) {
        const errorData = await verifierResponse.json();
        setErrors({
          email: errorData.message || 'Verification failed',
          password: errorData.message || 'Verification failed',
        });
        console.error('Verification failed:', errorData);
        return;
      }

      const verifierData = await verifierResponse.json();
      console.log('User verified:', verifierData);
      localStorage.setItem('token', verifierData.token);
      localStorage.setItem("userInfo", email);
      // localStorage.removeItem("authToken");
      router.push('/verifyCertificate');
    } catch (error) {
      console.error('An error occurred during login:', error);
      setErrors({ email: 'Something went wrong. Please try again.' });
    }
  };

  const handleSignUpRedirect = () => {
    router.push('/signup');
  };

  return (
    <div className="login-container">
      <div className="login-left-div">
        <Image src={loginImage} alt="icon" />
      </div>
      <div className="login-right-div">
        <form onSubmit={handleLogin} className="form-box">
          <Image src={logoMin} alt='logo' className='logo-image'/>
          <h2 className="login-title">Certificate Verifier</h2>
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


          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="error-message1">{errors.password}</p>}

          <div className="login-forgot">
            <span onClick={() => router.push('/forgotPass')}>Forgot your password?</span>
          </div>

          <button type="submit" className="login-button">
            Log in
          </button>

          <p className="login-signup-redirect">
            Don’t have an account?{' '}
            <span onClick={handleSignUpRedirect} className="login-signup-link">
              Signup
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
