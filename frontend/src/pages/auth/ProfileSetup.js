import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


const ProfileSetup = () => {
  const navigate = useNavigate();
const [formData, setFormData] = useState({
  full_name:"",
  age: "",
  gender: "",
  // identity: "",
  nationality: "",
  generation: "",
  currentlyPregnant: false,
  pregnancyWeeks: "",
  estimatedDueDate: "",
  firstPregnancy: false,
  hasProvider: false,
  prenatalServices: "",
  healthcareSystem: "",
  navigationExperience: "",
  culturalChallenges: "",
  preferredLanguage: "",
  dietaryPreferences: "",
  physicalActivity: "",
  primaryInfoSource: "",
  expectations: "",
  challenges: "",
  wantsPersonalizedResources: false,
  additionalComments: "",
});
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const filteredData = { ...formData };
    delete filteredData.identity;

    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/mom/survey`, filteredData);

    if (res.status === 200) {
      console.log(res.data);
      
      // Save form data to localStorage (or state)
      localStorage.setItem("profileData", JSON.stringify(filteredData));

      toast.success("Profile submitted successfully!", { position: "top-center" });

      setTimeout(() => {
        navigate("/supporters"); // Navigate to profile display page
      }, 3000);
    }
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message || "Internal server error", { position: "top-center" });
  }
};




const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData((prevData) => ({
    ...prevData,
    [name]: type === "checkbox" ? checked : value,
  }));
};



  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          WELCOME, Let’s Get You Set Up!
        </h1>
        <p className="text-gray-600 mt-2">
          Complete this profile to help us curate the best experience for you.
          Don’t worry—feel free to return and update it anytime.
        </p>
        <form onSubmit={handleSubmit}>
        {/* Section 1: General Details */}
        <section className="mt-6">
          <div className="bg-gray-200 p-3 rounded-md font-semibold">
            Section 1: General Details
            <p className="text-gray-400 mt-1">
            Let’s start with some basic information.
          </p>
          </div>
          
          <div className="mt-4 space-y-4">
            <label className="block">Full Name</label>
            <input
             type="text"
             name="full_name"
             value={formData.full_name}
             onChange={handleChange}
              className="input-field" />

            <label className="block">Age</label>
            <input 
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
             className="input-field" />

            <label className="block">Gender Identity</label>
            <select
            name="gender"
            value={formData.gender} 
            onChange={handleChange}
            className="input-field">
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
            </select>

            <label className="block">Nationality</label>
            <input 
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
             className="input-field" />

            <label className="block">Generation</label>
            <select 
            name="generation"
            value={formData.generation}
            onChange={handleChange}
            className="input-field">
              <option>Gen Z</option>
              <option>Millennial</option>
              <option>Gen X</option>
              <option>Baby Boomer</option>
            </select>
          </div>
        </section>

        {/* Section 2: Pregnancy Status */}
        <section className="mt-6">
          <div className="bg-gray-200 p-3 rounded-md font-semibold">
            Section 2: Pregnancy Status
            <p className="text-gray-400 mt-1">Let’s know about your pregnancy journey.</p>
          </div>
          
          <div className="mt-4 space-y-4">
            <label className="block">Are you currently pregnant or planning?</label>
            <input 
            type="text"
            name="currentlyPregnant"
            value={formData.currentlyPregnant}
            onChange={handleChange}
             className="input-field" />

            <label className="block">How far along are you?</label>
            <input 
  type="text"
  name="pregnancyWeeks"  // ✅ Change to match state key
  value={formData.pregnancyWeeks}
  onChange={handleChange}
  className="input-field" 
/>


            <label className="block">Estimated due date</label>
            <input 
            type="date"
            name="estimatedDueDate"
            value={formData.estimatedDueDate}
            onChange={handleChange}
            className="input-field" />

            <label className="block">Is this your first pregnancy?</label>
            <select
            name="firstPregnancy"
            value={formData.firstPregnancy}
            onChange={handleChange} 
            className="input-field">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </section>

        {/* Section 3: Health & Healthcare */}
        <section className="mt-6">
          <div className="bg-gray-200 p-3 rounded-md font-semibold">
            Section 3: Health & Healthcare
            <p className="text-gray-400 mt-1">Any relevant health conditions.</p>
          </div>
         
          <div className="mt-4 space-y-4">
            <label className="block">Do you have a healthcare provider (OB/GY)?</label>
            <input 
            type="text"
            name="hasProvider"
            value={formData.hasProvider} 
            onChange={handleChange}
            className="input-field" />

            <label className="block">Are you using any specific prenatal care services?</label>
            <input 
            type="text"
            name="prenatalServices"
            value={formData.prenatalServices} 
            onChange={handleChange}
            className="input-field" />

            <label className="block">what type of healthcare system are you currently using?</label>
            <input 
            type="text"
            name="healthcareSystem"
            value={formData.healthcareSystem}
            onChange={handleChange}
            className="input-field" />

            <label className="block">How would you describe your experience navigating the healthcare system during pregnancy?</label>
            <input 
            type="text"
            name="navigationExperience"
            value={formData.navigationExperience}
            onChange={handleChange}
            className="input-field" />
            <label className="block">Have you experience any challanges related to cultural differences when seeking healthcare in the U.S?</label>
            <input 
            type="text" 
            name="culturalChallenges"
            value={formData.culturalChallenges}
            onChange={handleChange}
            className="input-field" />
          </div>
        </section>

        {/* Section 4: Lifestyle & Preferences */}
        <section className="mt-6">
          <div className="bg-gray-200 p-3 rounded-md font-semibold">
            Section 4: Lifestyle & Preferences
            <p className="text-gray-400 mt-1">Help us understand your personal preferences and Lifestyle</p>
          </div>
          
          <div className="mt-4 space-y-4">
            <label className="block">what is preferred language for medical advice and resources?</label>
            <input 
            type="text" 
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            className="input-field" />

            <label className="block">Do you follow any specific dietary preferences or restrictions?</label>
            <input 
            type="text" 
            name="dietaryPreferences"
            value={formData.dietaryPreferences}
            onChange={handleChange}
            className="input-field" />
            <label className="block">Do you currently exercise or engage in physical activity during pregnancy?</label>
            <input 
            type="text" 
            name="physicalActivity"
            value={formData.physicalActivity}
            onChange={handleChange}
            className="input-field" />
            <label className="block">What is your primary source of information during pregnancy?</label>
            <input 
            type="text" 
            name="primaryInfoSource"
            value={formData.primaryInfoSource}
            onChange={handleChange}
            className="input-field" />
            
          </div>
        </section>

        {/* Section 5: Support System */}
        <section className="mt-6">
          <div className="bg-gray-200 p-3 rounded-md font-semibold">
            Section 5: Support System
            <p className="text-gray-400 mt-1">We'd like to hear about your expectations and any concerns you may have.</p>
          </div>
          
          <div className="mt-4 space-y-4">
            <label className="block">What do you expect most from the Platform?</label>
            <input 
            type="text" 
            name="expectations"
            value={formData.expectations}
            onChange={handleChange}
            className="input-field" />

            <label className="block">Are there any specific challanges or concerns you would like support with?</label>
            <input 
            type="text" 
            name="challenges"
            value={formData.challenges}
            onChange={handleChange}
            className="input-field" />
            <label className="block">Would you like to receive personalized resources,tips,or reminders based on your profile?</label>
            <input 
            type="text" 
            name="wantsPersonalizedResources"
            value={formData.wantsPersonalizedResources}
            onChange={handleChange}
            className="input-field" />
            <label className="block">Any additional comments feedback for us?</label>
            <input 
            type="text" 
            name="additionalComments"
            value={formData.additionalComments}
            onChange={handleChange}
            className="input-field" />
          </div>
        </section>

        {/* Submit Button */}
        <div className="mt-6 text-center">
            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
              NEXT
            </button>
          </div>
          </form>
      </div>
    </div>
  );
};

// TailwindCSS Input Styles
const inputStyles = `
  .input-field {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    outline: none;
    transition: border 0.3s;
  }
  .input-field:focus {
    border-color: #6b46c1;
  }
`;

export default () => (
  <>
    <style>{inputStyles}</style>
    <ProfileSetup />
  </>
);
