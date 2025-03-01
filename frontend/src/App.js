import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";  // Import HomePage
import SelectRole from "./pages/auth/SelectRole";  
import Register from "./pages/auth/Register";
import SupporterRegister from "./pages/auth/SupporterRegister";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Set Home as the starting page */}
        <Route path="/SelectRole" element={<SelectRole />} />  
        <Route path="/signup" element={<Register />} />  
        <Route path="/SupporterRegister" element={<SupporterRegister />} /> {/* New route */}
        <Route path="*" element={<h1>Page Not Found</h1>} />  
      </Routes>
    </Router>
  );
}

export default App;
