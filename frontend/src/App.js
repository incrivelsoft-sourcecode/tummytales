import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";  // Import HomePage
import SelectRole from "./pages/auth/SelectRole";  
import Register from "./pages/auth/Register";
import SupporterRegister from "./pages/auth/SupporterRegister";
import SignIn from "./pages/auth/SignIn"
import { ToastContainer } from 'react-toastify';

function App() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userName = urlParams.get('userName');
    const role = urlParams.get('role');
    
    
    if (token && userName) {
      localStorage.setItem('token', token);
      localStorage.setItem('userName', userName);
      localStorage.setItem('role', role);
      window.location.href = '/';
    }
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Set Home as the starting page */}
        <Route path="/SelectRole" element={<SelectRole />} />  
        <Route path="/signup" element={<Register />} />  
        <Route path="/SupporterRegister" element={<SupporterRegister />} /> {/* New route */}
        <Route path="/SignIn" element={<SignIn/>}/>
        <Route path="*" element={<h1>Page Not Found</h1>} />  
      </Routes>
      <ToastContainer/>
    </Router>
  );
}

export default App;
