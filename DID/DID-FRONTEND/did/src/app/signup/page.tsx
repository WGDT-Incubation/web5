"use client";

import React, { useState, useEffect } from "react";
import "./signup.css";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignUp = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const apiIp = process.env.NEXT_PUBLIC_API_URL;
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    department?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!department) {
      newErrors.department = "Department is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!validate()) return;

    try {
      const res = await fetch(`${apiIp}admin/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email,
          password,
          department: department,
        }),
      });

      const raw = await res.text();

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }

      if (!res.ok) {
        const errorMsg =
          data?.message || data?.error || raw || `HTTP ${res.status}`;
        setApiError(errorMsg);
        return;
      }

      const successMsg = data?.message || "Signup successful!";
      setApiSuccess(successMsg);
      setTimeout(() => router.push("/"), 1000);
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const handleLoginRedirect = () => {
    router.push("/");
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${apiIp}admin/getAllDepartments`);
        const data = await res.json();
  
        if (res.ok && Array.isArray(data.departments)) {
          setDepartments(data.departments);
        } else {
          console.error("Invalid department data:", data);
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      }
    };
  
    fetchDepartments();
  }, [apiIp]);
  

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
        <div className="signup-dropdown-wrapper">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="signup-input"
          >
            <option value="">Select Department</option>
            {departments.map((dept, i) => (
              <option key={i} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {errors.department && (
            <p className="error-message1">{errors.department}</p>
          )}
        </div>

        <div className="signup-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
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
            type={showConfirmPassword ? "text" : "password"}
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
        {apiSuccess && <p className="success-message">{apiSuccess}</p>}

        <button type="submit" className="signup-button">
          Sign Up
        </button>

        <p className="signup-login-redirect">
          Already have an account?{" "}
          <span onClick={handleLoginRedirect} className="signup-login-link">
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
