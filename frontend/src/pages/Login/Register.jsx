"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createAccount } from "../../services/authApi";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../../util/slices/userSlice";

import './login.css';


const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        termsAccepted: !!data.termsAndConditions, 
      };


      const response = await createAccount(registrationData);

      if (response.token) {
        localStorage.setItem('token', response.token);
        dispatch(setUser({
          user: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            username: data.username,
            isAdmin: response.user?.isAdmin || false,
            termsAccepted: true
          },
          token: response.token
        }));
        
        toast.success(response.message || "Registration successful!");
        navigate("/");
      } else {
        throw new Error(response.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred during registration.";
      toast.error(errorMessage);
      console.error("Registration error details:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-div">
      <div className="login-container">
        <h1>Register</h1>
        <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
          {/* First Name */}
          <div className="form-group">
            <label htmlFor="firstName">First Name<span className="required-asterisk">*</span></label>
            <input
              type="text"
              id="firstName"
              placeholder="Enter your First Name"
              {...register("firstName", {
                required: "First Name is required",
              })}
            />
            {errors.firstName && <p className="input-errors">{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label htmlFor="lastName">Last name<span className="required-asterisk">*</span></label>
            <input
              type="text"
              id="lastName"
              placeholder="Enter your Last Name"
              {...register("lastName", {
                required: "Last Name is required",
              })}
            />
            {errors.lastName && <p className="input-errors">{errors.lastName.message}</p>}
          </div>

          {/* User Name */}
          <div className="form-group">
            <label htmlFor="username">User name</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your User Name"
              {...register("username")}
            />
            {errors.username && <p className="input-errors">{errors.username.message}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email<span className="required-asterisk">*</span></label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && <p className="input-errors">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password<span className="required-asterisk">*</span></label>
            <div className="input-wrapper">
              <input
                id="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              <button
                type="button"
                className="showPasswordIcon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.password && <p className="input-errors">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password<span className="required-asterisk">*</span></label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                placeholder="Confirm your password"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => 
                    value === password || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className="showPasswordIcon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="input-errors">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="login-popup-condition">
            <input
              type="checkbox"
              id="termsAndConditions"
              {...register("termsAndConditions", {
                validate: (value) =>
                  value === true || "You must agree to the terms of use and privacy policy to register.",
              })}
            />
            <p>By continuing, i agree to the terms of use & privacy policy.<span className="required-asterisk">*</span></p>
          </div>
          {errors.termsAndConditions && (
            <p className="input-errors">{errors.termsAndConditions.message}</p>
          )}

          <button 
            type="submit" 
            className="login-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="extra-links">
          <p>
            Already have an account? <Link to="/login" className="text">Login</Link>
          </p>
          
        </div>
      </div>
    </div>
  );
};

export default Register;
