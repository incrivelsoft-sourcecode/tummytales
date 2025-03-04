import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "../../styles/Register.css"; // Import CSS file for styling
import axios from "axios";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.includes("@")) newErrors.email = "Invalid email";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (validateForm()) {
        console.log("Form submitted successfully", formData);
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/users/register-user`,
          {
            user_name: formData.username,
            email: formData.email,
            password: formData.password,
            confirm_password: formData.confirmPassword,
            role: "mom"
          }
        );
        if (res.status === 201) {
          console.log(res.data);
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("userName", res.data.userName);
          localStorage.setItem("role", res.data.role);
          toast.success(res.data.message || "Registeration successful...", { "position": "top-center" });
          setTimeout(() => {
            navigate("/");
          }, 3000);

        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message || "Internal server error", { "position": "top-center" });
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/")
    }
  }, []);

  return (
    <div className="signup-container">
      <h2>Sign Up For Mother</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
          {errors.username && <p className="error">{errors.username}</p>}
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        <div className="input-group password-group">
          <label>Create Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        <div className="input-group password-group">
          <label>Confirm Password</label>
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="eye-icon">
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        </div>

        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default Register;
