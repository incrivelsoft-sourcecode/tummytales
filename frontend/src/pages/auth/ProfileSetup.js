import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
 
 
const ProfileSetup = () => {
//   const user_name = localStorage.getItem("userName") || ""; // Retrieve stored username
// console.log("Retrieved user_name:", user_name);
const userId = localStorage.getItem("userId") || "";
console.log("Retrieved userId:", userId); 

  const navigate = useNavigate();
 
  const [formData, setFormData] = useState({
    // Required general fields
  first_name: "",
  last_name: "",
  dob: "",
  gender: "",
  nationality: "",
  Phonenumber: "",
  email: "",
  country: "",
  Addressline1: "",
  Addressline2: "",
  city: "",
  State: "",
  Zip_code: "",

  // Pregnancy Status
  currentlyPregnant: false,
  Last_menstrualperiod: "",
  estimatedDueDate: "",

  PregnancyLoss: false, // maps to hasPregnancyLoss
  dateOfLoss: "",
  reason: "",
  gestationWeeks: "",
  treatmentLocation: "",

  firstChild: false, // maps to isFirstChild
  firstChildDob: "",
  complications: "",
  deliverymethod: "",
  childbornlocation: "",
  gestationalAgeAtBirth: "",

  // HealthCare Info
  hasPrimaryCarePhysician: false,
  primaryFirst_name: "",
  primaryLast_name: "",
  primaryCountry: "",
  primaryAddressline1: "",
  primaryAddressline2: "",
  primaryCity: "",
  primaryState: "",
  primaryZip_code: "",
  primaryPhonenumber: "",

  hasOBGYN: false,
  obgynFirst_name: "",
  obgynLast_name: "",
  obgynCountry: "",
  obgynAddressline1: "",
  obgynAddressline2: "",
  obgynCity: "",
  obgynState: "",
  obgynZip_code: "",
  obgynPhonenumber: "",

  // Other
  insuranceProvider: "",
  medications: [],
  consumesAlcoholOrSmokes: false,
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
 
  // List of required fields
  const requiredFields = [
    "first_name",
    "last_name",
    "dob",
    "gender",
    "nationality",
    "Phonenumber",
    "email",
    "country",
    "Addressline1",
    "city",
    "State",
    "Zip_code"
  ];
 
  const missingFields = requiredFields.filter(field => !formData[field]);
 
  if (missingFields.length > 0) {
    toast.error(`Missing fields: ${missingFields.join(", ")}`, { position: "top-center" });
    return; // Stop execution if fields are missing
  }
 
  try {
    // Filter out empty strings from formData
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== "")
    );
 
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/mom/survey`,
      { userId, ...filteredData }
    );
 
    if (res.status === 200) {
      console.log(res.data);
      const { survey } = res.data;
const { _id } = survey; // Now this will correctly extract the _id
 
 
      localStorage.setItem("profileData", JSON.stringify(filteredData));
      localStorage.setItem("profileId", _id);
      //localStorage.setItem("profileId", _id);
console.log("Saved profileId to localStorage:", localStorage.getItem("profileId"));
 
      toast.success("Profile submitted successfully!", { position: "top-center" });
 
      setTimeout(() => {
        navigate("/supporters");
      }, 3000);
    }
  } catch (error) {
    console.error("Error Response:", error.response?.data);
   
    const errorMessage = error.response?.data?.error || "Internal server error";
    toast.error(errorMessage, { position: "top-center", autoClose: 5000 });
  }
};
 
const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData((prevData) => ({
    ...prevData,
    // [name]: type === "checkbox" ? checked : value,
    [name]: type === "checkbox" ? checked : value || undefined,
  }));
};
 
 
 
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Full Width Welcome Banner */}
      <div
        className="relative h-screen w-full bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/Image23.jpeg')", // Replace with your actual image path
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            Welcome, Let’s Get You Set Up!
          </h1>
          <p className="text-white text-lg md:text-xl mt-6 drop-shadow">
            Complete this profile to help us curate the best experience for you. Don’t worry—feel free to return
            and update it anytime. Keeping it up to date will ensure you get the most relevant and personalized
            support throughout your journey.
          </p>
        </div>
      </div>
 
      {/* Form Container */}
      <div className="flex justify-center p-6">
        <div className="max-w-4xl w-full rounded-lg p-6">
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
              <label className="block">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
              />
              <label className="block">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
              />
 
              <label className="block">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="input-field"
              />
 
              <label className="block">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
              <option value="">Select an option</option>
               <option>Female</option>
                <option>Male</option>
                <option>Transgender</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
 
              <label className="block">Nationality</label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="input-field"
              >
              <option value="">Select an option</option>
               <option>India</option>
                <option>Pakistan</option>
                <option>Bangladesh</option>
                <option>SriLanka</option>
              </select>
 
              <label className="block">Mobile Phone Number</label>
              <input
                type="text"
                name="Phonenumber"
                value={formData.Phonenumber}
                onChange={handleChange}
                className="input-field"
              />
              <label className="block">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
              />
              <div className="bg-yellow-50 p-6 rounded-md shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Address</h2>
 
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md"
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                    {/* Add more countries */}
                  </select>
                </div>
 
                <div className="mb-4">
                  <label className="block mb-1 font-medium">
                    Address Line 1{" "}
                    <span className="text-red-500">(required)</span>
                  </label>
                  <input
                    type="text"
                    name="Addressline1"
                    value={formData.Addressline1}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md"
                    required
                  />
                </div>
 
                <div className="mb-4">
                  <label className="block mb-1 font-medium">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="Addressline2"
                    value={formData.Addressline2}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      City <span className="text-red-500">(required)</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      State <span className="text-red-500">(required)</span>
                    </label>
                    <input
                      type="text"
                      name="State"
                      value={formData.State}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      ZIP Code <span className="text-red-500">(required)</span>
                    </label>
                    <input
                      type="text"
                      name="Zip_code"
                      value={formData.Zip_code}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
           
          </section>
 
         {/* Section 2: Pregnancy Status */}
<section
  className="mt-6"
  style={{ backgroundColor: "#c0c386", padding: "2rem", borderRadius: "0.5rem" }}
>
  <div className="bg-gray-200 p-3 rounded-md font-semibold">
    Section 2: Pregnancy Status
    <p className="text-gray-400 mt-1">
      Let’s know about your pregnancy journey.
    </p>
  </div>

  <div className="mt-4 space-y-4">
    <label className="block">
      Are you currently pregnant or planning on becoming pregnant?
    </label>
    <select
      name="currentlyPregnant"
      value={formData.currentlyPregnant ? "Yes" : "No"}
      onChange={(e) =>
        setFormData({
          ...formData,
          currentlyPregnant: e.target.value === "Yes",
        })
      }
    >
      <option value="">Select an option</option>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>

    <label className="block">
      When was the first day of your last menstrual period?
    </label>
    <input
      type="date"
      name="Last_menstrualperiod"
      value={formData.Last_menstrualperiod}
      onChange={handleChange}
      className="input-field"
    />

    <label className="block">
      If established, what is your estimated due date?
    </label>
    <input
      type="date"
      name="estimatedDueDate"
      value={formData.estimatedDueDate}
      onChange={handleChange}
      className="input-field"
    />

    {/* Pregnancy Loss Section */}
    <div>
      <label className="block">Have you ever experienced any pregnancy loss?</label>
      <select
        name="PregnancyLoss"
        value={formData.PregnancyLoss ? "Yes" : "No"}
        onChange={(e) =>
          setFormData({
            ...formData,
            PregnancyLoss: e.target.value === "Yes",
          })
        }
        className="input-field"
      >
        <option value="">Select an option</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      {formData.PregnancyLoss && (
        <>
          <label className="block mt-4">When was your last pregnancy loss?</label>
          <input
            type="date"
            name="dateOfLoss"
            value={formData.dateOfLoss}
            onChange={handleChange}
            className="input-field"
          />

          <label className="block mt-4">What was the reason given for the loss?</label>
          <select
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select an option</option>
            <option value="Medical Issue">Medical Issue</option>
            <option value="Accident">Accident</option>
            <option value="Unknown">Unknown</option>
          </select>

          <label className="block mt-4">How many weeks was the fetus at the time of the loss?</label>
          <input
            type="number"
            name="gestationWeeks"
            value={formData.gestationWeeks}
            onChange={handleChange}
            className="input-field"
          />

          <label className="block mt-4">Where did you get treated?</label>
          <input
            type="text"
            name="treatmentLocation"
            placeholder="City, State, Country"
            value={formData.treatmentLocation}
            onChange={handleChange}
            className="input-field"
          />
        </>
      )}
    </div>

    {/* First Child Section */}
    <div>
      <label className="block">Would this be your first child?</label>
      <select
        name="firstChild"
        value={formData.firstChild ? "No" : "Yes"}
        onChange={(e) =>
          setFormData({
            ...formData,
            firstChild: e.target.value === "No",
          })
        }
        className="input-field"
      >
        <option value="">Select an option</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      {formData.firstChild && (
        <>
          <label className="block mt-4">What is the date of birth of your first child?</label>
          <input
            type="date"
            name="firstChildDob"
            value={formData.firstChildDob}
            onChange={handleChange}
            className="input-field"
          />

          <label className="block mt-4">Were there any complications?</label>
          <textarea
            name="complications"
            value={formData.complications}
            onChange={handleChange}
            className="input-field"
          />

          <label className="block mt-4">What kind of delivery method was used?</label>
          <select
            name="deliverymethod"
            value={formData.deliverymethod}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select an option</option>
            <option value="Normal">Normal</option>
            <option value="C-section">C-section</option>
            <option value="Forceps/Vacuum">Forceps/Vacuum</option>
          </select>

          <label className="block mt-4">Where was your child born?</label>
          <input
            type="text"
            name="childbornlocation"
            placeholder="City, State, Country"
            value={formData.childbornlocation}
            onChange={handleChange}
            className="input-field"
          />

          <label className="block mt-4">What was the baby's gestational age at birth?</label>
          <input
            type="text"
            name="gestationalAgeAtBirth"
            placeholder="Weeks and Days"
            value={formData.gestationalAgeAtBirth}
            onChange={handleChange}
            className="input-field"
          />
        </>
      )}
    </div>
  </div>
</section>
{/* Section 3: Health & Healthcare */}
<section className="mt-6">
  <div className="bg-gray-200 p-3 rounded-md font-semibold">
    Section 3: Health & Healthcare
    <p className="text-gray-400 mt-1">
      Any relevant health conditions.
    </p>
  </div>

  <div className="mt-4 space-y-4">
    {/* Primary Care Physician */}
    <div>
      <label className="block mb-1">Do you have a primary care physician?</label>
      <select
        name="hasPrimaryCarePhysician"
        value={formData.hasPrimaryCarePhysician}
        onChange={handleChange}
        className="input-field border p-2 rounded w-full mb-4"
      >
        <option value="">Select an option</option>
        <option value={true}>Yes</option>
        <option value={false}>No</option>
      </select>

      {formData.hasPrimaryCarePhysician === "true" && (
        <>
          <div className="mb-2 font-semibold">Name of Doctor</div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              name="primaryFirst_name"
              placeholder="First Name"
              value={formData.primaryFirst_name}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
            <input
              type="text"
              name="primaryLast_name"
              placeholder="Last Name"
              value={formData.primaryLast_name}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
          </div>

          <div className="mb-2 font-semibold">Address of Doctor</div>
          <label className="block mb-1">Country</label>
          <select
            name="primaryCountry"
            value={formData.primaryCountry}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full mb-4"
          >
            <option value="United States">United States</option>
          </select>

          <input
            type="text"
            name="primaryAddressline1"
            placeholder="Address Line 1 (required)"
            value={formData.primaryAddressline1}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full mb-2"
          />
          <input
            type="text"
            name="primaryAddressline2"
            placeholder="Address Line 2"
            value={formData.primaryAddressline2}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full mb-2"
          />

          <div className="flex gap-4 mb-2">
            <input
              type="text"
              name="primaryCity"
              placeholder="City (required)"
              value={formData.primaryCity}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
            <input
              type="text"
              name="primaryState"
              placeholder="State (required)"
              value={formData.primaryState}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
            <input
              type="text"
              name="primaryZip_code"
              placeholder="ZIP Code (required)"
              value={formData.primaryZip_code}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
          </div>

          <input
            type="text"
            name="primaryPhonenumber"
            placeholder="Phone Number of Doctor"
            value={formData.primaryPhonenumber}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full"
          />
        </>
      )}
    </div>

    {/* OB/GYN Section */}
    <div>
      <label className="block mb-1">Do you have an OB/GYN?</label>
      <select
        name="hasOBGYN"
        value={formData.hasOBGYN}
        onChange={handleChange}
        className="input-field border p-2 rounded w-full mb-4"
      >
        <option value="">Select an option</option>
        <option value={true}>Yes</option>
        <option value={false}>No</option>
      </select>

      {formData.hasOBGYN === "true" && (
        <>
          <div className="mb-2 font-semibold">Name of Doctor</div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              name="obgynFirst_name"
              placeholder="First Name"
              value={formData.obgynFirst_name}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
            <input
              type="text"
              name="obgynLast_name"
              placeholder="Last Name"
              value={formData.obgynLast_name}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
          </div>

          <div className="mb-2">Address of Doctor</div>
          <label className="block mb-1">Country</label>
          <select
            name="obgynCountry"
            value={formData.obgynCountry}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full mb-4"
          >
            <option value="United States">United States</option>
          </select>

          <input
            type="text"
            name="obgynAddressline1"
            placeholder="Address Line 1 (required)"
            value={formData.obgynAddressline1}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full mb-2"
          />
          <input
            type="text"
            name="obgynAddressline2"
            placeholder="Address Line 2"
            value={formData.obgynAddressline2}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full mb-2"
          />

          <div className="flex gap-4 mb-2">
            <input
              type="text"
              name="obgynCity"
              placeholder="City (required)"
              value={formData.obgynCity}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
            <input
              type="text"
              name="obgynState"
              placeholder="State (required)"
              value={formData.obgynState}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
            <input
              type="text"
              name="obgynZip_code"
              placeholder="ZIP Code (required)"
              value={formData.obgynZip_code}
              onChange={handleChange}
              className="input-field border p-2 rounded w-full"
            />
          </div>

          <input
            type="text"
            name="obgynPhonenumber"
            placeholder="Phone Number of Doctor"
            value={formData.obgynPhonenumber}
            onChange={handleChange}
            className="input-field border p-2 rounded w-full"
          />
        </>
      )}
    </div>

    {/* Insurance */}
    <label className="block">Who is your Insurance Provider?</label>
    <input
      type="text"
      name="insuranceProvider"
      value={formData.insuranceProvider}
      onChange={handleChange}
      className="input-field"
    />

    {/* Medications */}
    <div className="">
      <label className="block mb-3 text-black">Are you currently on any medications?</label>
      <div className="flex flex-col gap-3">
        {/* Dynamically add from formData.medications if needed */}
        <button className="bg-black text-white py-2 px-4 w-fit">Add Medication</button>
      </div>
    </div>

    {/* Alcohol or Smoke */}
    <label className="block">Do you consume alcohol or smoke?</label>
    <select
      name="consumesAlcoholOrSmokes"
      value={formData.consumesAlcoholOrSmokes}
      onChange={handleChange}
      className="input-field border p-2 rounded w-full"
    >
      <option value="">Select an option</option>
      <option value={true}>Yes</option>
      <option value={false}>No</option>
    </select>
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
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
           
           Submit
            </button>
          </div>
        </form>
 
        </div>
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




















// import React from "react";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";


// const ProfileSetup = () => {
//   const user_name = localStorage.getItem("userName") || ""; // Retrieve stored username
// console.log("Retrieved user_name:", user_name); 
//   const navigate = useNavigate();
// const [formData, setFormData] = useState({
//   full_name:"",
//   age: "",
//   gender: "",
//   // identity: "",
//   nationality: "",
//   generation: "",
//   currentlyPregnant: false,
//   pregnancyWeeks: "",
//   estimatedDueDate: "",
//   firstPregnancy: false,
//   hasProvider: false,
//   prenatalServices: "",
//   healthcareSystem: "",
//   navigationExperience: "",
//   culturalChallenges: "",
//   preferredLanguage: "",
//   dietaryPreferences: "",
//   physicalActivity: "",
//   primaryInfoSource: "",
//   expectations: "",
//   challenges: "",
//   wantsPersonalizedResources: false,
//   additionalComments: "",
// });

// const handleSubmit = async (e) => {
//   e.preventDefault();

//   // List of required fields
//   const requiredFields = ["full_name", "age", "gender", "nationality", "generation"];
//   const missingFields = requiredFields.filter(field => !formData[field]);

//   if (missingFields.length > 0) {
//     toast.error(`Missing fields: ${missingFields.join(", ")}`, { position: "top-center" });
//     return; // Stop execution if fields are missing
//   }

//   try {
//     // Filter out empty strings from formData
//     const filteredData = Object.fromEntries(
//       Object.entries(formData).filter(([_, value]) => value !== "")
//     );

//     const res = await axios.post(
//       `${process.env.REACT_APP_BACKEND_URL}/mom/survey`,
//       { user_name, ...filteredData }
//     );

//     if (res.status === 200) {
//       console.log(res.data);
//       const { survey } = res.data;
// const { _id } = survey; // Now this will correctly extract the _id


//       localStorage.setItem("profileData", JSON.stringify(filteredData));
//       localStorage.setItem("profileId", _id);
//       //localStorage.setItem("profileId", _id);
// console.log("Saved profileId to localStorage:", localStorage.getItem("profileId"));

//       toast.success("Profile submitted successfully!", { position: "top-center" });

//       setTimeout(() => {
//         navigate("/supporters");
//       }, 3000);
//     }
//   } catch (error) {
//     console.error("Error Response:", error.response?.data);
    
//     const errorMessage = error.response?.data?.error || "Internal server error";
//     toast.error(errorMessage, { position: "top-center", autoClose: 5000 });
//   }
// };

// const handleChange = (e) => {
//   const { name, value, type, checked } = e.target;
//   setFormData((prevData) => ({
//     ...prevData,
//     // [name]: type === "checkbox" ? checked : value,
//     [name]: type === "checkbox" ? checked : value || undefined,
//   }));
// };



//   return (
//     <div className="min-h-screen bg-gray-100 flex justify-center p-6">
//       <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
//         <h1 className="text-2xl font-bold text-gray-800">
//           WELCOME, Let’s Get You Set Up!
//         </h1>
//         <p className="text-gray-600 mt-2">
//           Complete this profile to help us curate the best experience for you.
//           Don’t worry—feel free to return and update it anytime.
//         </p>
//         <form onSubmit={handleSubmit}>
//         {/* Section 1: General Details */}
//         <section className="mt-6">
//           <div className="bg-gray-200 p-3 rounded-md font-semibold">
//             Section 1: General Details
//             <p className="text-gray-400 mt-1">
//             Let’s start with some basic information.
//           </p>
//           </div>
          
//           <div className="mt-4 space-y-4">
//             <label className="block">Full Name</label>
//             <input
//              type="text"
//              name="full_name"
//              value={formData.full_name}
//              onChange={handleChange}
//               className="input-field" />

//             <label className="block">Age</label>
//             <input 
//             type="number"
//             name="age"
//             value={formData.age}
//             onChange={handleChange}
//              className="input-field" />

//             <label className="block">Gender Identity</label>
//             <select
//             name="gender"
//             value={formData.gender} 
//             onChange={handleChange}
//             className="input-field">
//               <option>Male</option>
//               <option>Female</option>
//               <option>Non-binary</option>
//             </select>

//             <label className="block">Nationality</label>
//             <input 
//             type="text"
//             name="nationality"
//             value={formData.nationality}
//             onChange={handleChange}
//              className="input-field" />

//             <label className="block">Generation</label>
//             <select 
//             name="generation"
//             value={formData.generation}
//             onChange={handleChange}
//             className="input-field">
//               <option>Gen Z</option>
//               <option>Millennial</option>
//               <option>Gen X</option>
//               <option>Baby Boomer</option>
//             </select>
//           </div>
//         </section>

//         {/* Section 2: Pregnancy Status */}
//         <section className="mt-6">
//           <div className="bg-gray-200 p-3 rounded-md font-semibold">
//             Section 2: Pregnancy Status
//             <p className="text-gray-400 mt-1">Let’s know about your pregnancy journey.</p>
//           </div>
          
//           <div className="mt-4 space-y-4">
//             <label className="block">Are you currently pregnant or planning?</label>
//             <input 
//             type="text"
//             name="currentlyPregnant"
//             value={formData.currentlyPregnant}
//             onChange={handleChange}
//              className="input-field" />

//             <label className="block">How far along are you?</label>
//             <input 
//   type="text"
//   name="pregnancyWeeks"  // ✅ Change to match state key
//   value={formData.pregnancyWeeks}
//   onChange={handleChange}
//   className="input-field" 
// />


//             <label className="block">Estimated due date</label>
//             <input 
//             type="date"
//             name="estimatedDueDate"
//             value={formData.estimatedDueDate}
//             onChange={handleChange}
//             className="input-field" />

//             <label className="block">Is this your first pregnancy?</label>
//             <select
//             name="firstPregnancy"
//             value={formData.firstPregnancy}
//             onChange={handleChange} 
//             className="input-field">
//               <option>Yes</option>
//               <option>No</option>
//             </select>
//           </div>
//         </section>

//         {/* Section 3: Health & Healthcare */}
//         <section className="mt-6">
//           <div className="bg-gray-200 p-3 rounded-md font-semibold">
//             Section 3: Health & Healthcare
//             <p className="text-gray-400 mt-1">Any relevant health conditions.</p>
//           </div>
         
//           <div className="mt-4 space-y-4">
//             <label className="block">Do you have a healthcare provider (OB/GY)?</label>
//             <input 
//             type="text"
//             name="hasProvider"
//             value={formData.hasProvider} 
//             onChange={handleChange}
//             className="input-field" />

//             <label className="block">Are you using any specific prenatal care services?</label>
//             <input 
//             type="text"
//             name="prenatalServices"
//             value={formData.prenatalServices} 
//             onChange={handleChange}
//             className="input-field" />

//             <label className="block">what type of healthcare system are you currently using?</label>
//             <input 
//             type="text"
//             name="healthcareSystem"
//             value={formData.healthcareSystem}
//             onChange={handleChange}
//             className="input-field" />

//             <label className="block">How would you describe your experience navigating the healthcare system during pregnancy?</label>
//             <input 
//             type="text"
//             name="navigationExperience"
//             value={formData.navigationExperience}
//             onChange={handleChange}
//             className="input-field" />
//             <label className="block">Have you experience any challanges related to cultural differences when seeking healthcare in the U.S?</label>
//             <input 
//             type="text" 
//             name="culturalChallenges"
//             value={formData.culturalChallenges}
//             onChange={handleChange}
//             className="input-field" />
//           </div>
//         </section>

//         {/* Section 4: Lifestyle & Preferences */}
//         <section className="mt-6">
//           <div className="bg-gray-200 p-3 rounded-md font-semibold">
//             Section 4: Lifestyle & Preferences
//             <p className="text-gray-400 mt-1">Help us understand your personal preferences and Lifestyle</p>
//           </div>
          
//           <div className="mt-4 space-y-4">
//             <label className="block">what is preferred language for medical advice and resources?</label>
//             <input 
//             type="text" 
//             name="preferredLanguage"
//             value={formData.preferredLanguage}
//             onChange={handleChange}
//             className="input-field" />

//             <label className="block">Do you follow any specific dietary preferences or restrictions?</label>
//             <input 
//             type="text" 
//             name="dietaryPreferences"
//             value={formData.dietaryPreferences}
//             onChange={handleChange}
//             className="input-field" />
//             <label className="block">Do you currently exercise or engage in physical activity during pregnancy?</label>
//             <input 
//             type="text" 
//             name="physicalActivity"
//             value={formData.physicalActivity}
//             onChange={handleChange}
//             className="input-field" />
//             <label className="block">What is your primary source of information during pregnancy?</label>
//             <input 
//             type="text" 
//             name="primaryInfoSource"
//             value={formData.primaryInfoSource}
//             onChange={handleChange}
//             className="input-field" />
            
//           </div>
//         </section>

//         {/* Section 5: Support System */}
//         <section className="mt-6">
//           <div className="bg-gray-200 p-3 rounded-md font-semibold">
//             Section 5: Support System
//             <p className="text-gray-400 mt-1">We'd like to hear about your expectations and any concerns you may have.</p>
//           </div>
          
//           <div className="mt-4 space-y-4">
//             <label className="block">What do you expect most from the Platform?</label>
//             <input 
//             type="text" 
//             name="expectations"
//             value={formData.expectations}
//             onChange={handleChange}
//             className="input-field" />

//             <label className="block">Are there any specific challanges or concerns you would like support with?</label>
//             <input 
//             type="text" 
//             name="challenges"
//             value={formData.challenges}
//             onChange={handleChange}
//             className="input-field" />
//             <label className="block">Would you like to receive personalized resources,tips,or reminders based on your profile?</label>
//             <input 
//             type="text" 
//             name="wantsPersonalizedResources"
//             value={formData.wantsPersonalizedResources}
//             onChange={handleChange}
//             className="input-field" />
//             <label className="block">Any additional comments feedback for us?</label>
//             <input 
//             type="text" 
//             name="additionalComments"
//             value={formData.additionalComments}
//             onChange={handleChange}
//             className="input-field" />
//           </div>
//         </section>

//         {/* Submit Button */}
//         <div className="mt-6 text-center">
//             <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
//               NEXT
//             </button>
//           </div>
//           </form>
//       </div>
//     </div>
//   );
// };

// // TailwindCSS Input Styles
// const inputStyles = `
//   .input-field {
//     width: 100%;
//     padding: 10px;
//     border: 1px solid #ccc;
//     border-radius: 6px;
//     outline: none;
//     transition: border 0.3s;
//   }
//   .input-field:focus {
//     border-color: #6b46c1;
//   }
// `;

// export default () => (
//   <>
//     <style>{inputStyles}</style>
//     <ProfileSetup />
//   </>
// );
