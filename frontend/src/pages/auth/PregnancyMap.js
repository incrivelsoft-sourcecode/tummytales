import React from "react";
import "../../styles/PregnancyMap.css"; // Create a CSS file for styling

const Pregnancy = () => {
  return (
    <div className="pregnancy-container">
      <div className="pregnancy-content">
        <div className="catalog">
          <h2><b>CATALOG</b></h2>
          <button className="trimester-btn">1st Trimester</button>
          <button className="trimester-btn">2nd Trimester</button>
          <button className="trimester-btn">3rd Trimester</button>
        </div>
        <div className="features">
          <h2><b>FEATURES</b></h2>
          <p><u>Pregnancy Tracker</u></p>
          <p><u>Daily Journal</u></p>
          <p><u>MOM Network</u></p>
          <p><u>Ask AI</u></p>
        </div>
      </div>
    </div>
  );
};

export default Pregnancy;
