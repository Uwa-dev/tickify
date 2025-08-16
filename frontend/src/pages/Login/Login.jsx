"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { loginAccount } from "../../services/authApi";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../../util/slices/userSlice";

import './login.css'

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await loginAccount(data);
          
      console.log("Login token:", response.token); // ✅ Corrected line
      localStorage.setItem("token", response.token);
      
      
      if (response.token) {
        dispatch(setUser({
          user: {
            _id: response.user._id,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            email: response.user.email,
            username: response.user.username,
            isAdmin: response.user.isAdmin || false
          },
          token: response.token
        }));
        toast.success(response.message || "Login successful");
        navigate("/");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="login-div">
      <div className="login-container">
      <h1>Login</h1>
      <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
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
        <div className="form-group">
          <label htmlFor="password">Password</label>
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
              // className="absolute text-gray-500 right-2 top-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOffIcon size={18} />
              ) : (
                <EyeIcon size={18} />
              )}
            </button>
          </div>

          {errors.password && <p className="input-errors">{errors.password.message}</p>}


        </div>
        <button type="submit" className="login-btn" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="extra-links">
        <p>
          Don't have an account? <Link to="/register" className="text">Sign up</Link>
        </p>
        <p>
          <Link to="/forgot-password" className="text">Forgot your password?</Link>
        </p>
      </div>
      <div
        id="login-message"
        style={{
          marginBottom: '1rem',
          marginTop: '1rem',
          textAlign: 'center',
        }}
      ></div>
    </div>
    </div>
  );
};

export default Login;
