import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/SelectRole.css"; // Import the CSS file

const SelectRole = () => {
  const navigate = useNavigate();

  return (
    <div className="role-container">
      <h2>Select Your Role</h2>
      <div className="role-cards">
        {/* Mother Card */}
        <div className="role-card mother" onClick={() => navigate("/signup")}>
          <img src="/image.png" alt="Mother" className="role-image" />
          <h3>Mother</h3>
          <p>Sign up as a mother</p>
        </div>

        {/* Supporter Card */}
        <div className="role-card supporter" onClick={() => navigate("/SupporterRegister")}>
          <img src="/images/supporter.png" alt="Supporter" className="role-image" />
          <h3>Supporter</h3>
          <p>Support mothers in their journey</p>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
