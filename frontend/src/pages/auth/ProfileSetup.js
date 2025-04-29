import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ProfileSetup = () => {
  const userId = localStorage.getItem("userId") || "";
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

  const [medications, setMedications] = useState([]);

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
      toast.error(`Missing fields: ${missingFields.join(", ")}`);
      return; // Stop execution if fields are missing
    }
   
    try {
      // Prepare the data to send with medications
      const dataToSend = {
        ...formData,
        medications: medications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency
        }))
      };

     // Filter out empty strings from formData
const filteredData = Object.fromEntries(
  Object.entries(dataToSend).filter(
    ([_, value]) =>
      value !== "" &&
      value !== undefined &&
      value !== null &&
      !(Array.isArray(value) && value.length === 0)
  )
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
        console.log("Saved profileId to localStorage:", localStorage.getItem("profileId"));
   
        toast.success("Profile submitted successfully!");
   
        setTimeout(() => {
          navigate("/supporters");
        }, 3000);
      }
    } catch (error) {
      console.error("Error Response:", error.response?.data);
     
      const errorMessage = error.response?.data?.error || "Internal server error";
      toast.error(errorMessage, { autoClose: 5000 });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value || undefined,
    }));
  };

  const handleAddMedication1 = () => {
    // Check if medication 1 already exists
    const med1Exists = medications.some(med => med.type === 1);
    
    if (!med1Exists) {
      setMedications([...medications, { 
        type: 1, 
        name: "", 
        dosage: "", 
        frequency: "" 
      }]);
    }
  };

  const handleAddMedication2 = () => {
    // Check if medication 2 already exists
    const med2Exists = medications.some(med => med.type === 2);
    
    if (!med2Exists) {
      setMedications([...medications, { 
        type: 2, 
        name: "", 
        dosage: "", 
        frequency: "" 
      }]);
    }
  };

  const handleMedicationInputChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };

  const handleRemoveMedication = (type) => {
    setMedications(medications.filter(med => med.type !== type));
  };

  return (
    <div className="min-h-screen bg-[#fefdf7]">
      {/* Hero Section */}
      <div
        className="relative h-[400px] w-full bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/lovable-uploads/102dd82a-40c1-4d0a-bb35-06dce71e7ee4.png')",
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Welcome, Let's Get You Set Up!
          </h1>
          <p className="text-white text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Complete this profile to help us curate the best experience for you. Don't worry—feel free to return
            and update it anytime. Keeping it up to date will ensure you get the most relevant and personalized
            support throughout your journey.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Headers */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Section 1: General Details</h2>
            <p className="text-gray-600 mt-1">Let's start with some basic information.</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* General Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Transgender</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nationality</label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option>India</option>
                  <option>Pakistan</option>
                  <option>Bangladesh</option>
                  <option>SriLanka</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mobile Phone Number</label>
                <input
                  type="text"
                  name="Phonenumber"
                  value={formData.Phonenumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-md shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address Line 1 <span className="text-red-500">(required)</span>
                  </label>
                  <input
                    type="text"
                    name="Addressline1"
                    value={formData.Addressline1}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="Addressline2"
                    value={formData.Addressline2}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    City <span className="text-red-500">(required)</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    State <span className="text-red-500">(required)</span>
                  </label>
                  <input
                    type="text"
                    name="State"
                    value={formData.State}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ZIP Code <span className="text-red-500">(required)</span>
                  </label>
                  <input
                    type="text"
                    name="Zip_code"
                    value={formData.Zip_code}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pregnancy Status Section */}
          <div className="bg-gray-100 p-4 rounded-lg mt-8">
            <h2 className="text-xl font-semibold">Section 2: Pregnancy Status</h2>
            <p className="text-gray-600 mt-1">Let's know about your pregnancy journey.</p>
          </div>
          
          <div className="space-y-6 p-6 bg-[#c0c386] rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  When was the first day of your last menstrual period?
                </label>
                <input
                  type="date"
                  name="Last_menstrualperiod"
                  value={formData.Last_menstrualperiod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  If established, what is your estimated due date?
                </label>
                <input
                  type="date"
                  name="estimatedDueDate"
                  value={formData.estimatedDueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Have you ever experienced any pregnancy loss?
                </label>
                <select
                  name="PregnancyLoss"
                  value={formData.PregnancyLoss ? "Yes" : "No"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      PregnancyLoss: e.target.value === "Yes",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {formData.PregnancyLoss && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-white/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    When was your last pregnancy loss?
                  </label>
                  <input
                    type="date"
                    name="dateOfLoss"
                    value={formData.dateOfLoss}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What was the reason given for the loss?
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select an option</option>
                    <option value="Medical Issue">Medical Issue</option>
                    <option value="Accident">Accident</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    How many weeks was the fetus at the time of the loss?
                  </label>
                  <input
                    type="number"
                    name="gestationWeeks"
                    value={formData.gestationWeeks}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Where did you get treated?
                  </label>
                  <input
                    type="text"
                    name="treatmentLocation"
                    placeholder="City, State, Country"
                    value={formData.treatmentLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Would this be your first child?
                </label>
                <select
                  name="firstChild"
                  value={formData.firstChild ? "No" : "Yes"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstChild: e.target.value === "No",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {formData.firstChild && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-white/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What is the date of birth of your first child?
                  </label>
                  <input
                    type="date"
                    name="firstChildDob"
                    value={formData.firstChildDob}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Were there any complications?
                  </label>
                  <textarea
                    name="complications"
                    value={formData.complications}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What kind of delivery method was used?
                  </label>
                  <select
                    name="deliverymethod"
                    value={formData.deliverymethod}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select an option</option>
                    <option value="Normal">Normal</option>
                    <option value="C-section">C-section</option>
                    <option value="Forceps/Vacuum">Forceps/Vacuum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Where was your child born?
                  </label>
                  <input
                    type="text"
                    name="childbornlocation"
                    placeholder="City, State, Country"
                    value={formData.childbornlocation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What was the baby's gestational age at birth?
                  </label>
                  <input
                    type="text"
                    name="gestationalAgeAtBirth"
                    placeholder="Weeks and Days"
                    value={formData.gestationalAgeAtBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Health & Healthcare Section */}
          <div className="bg-gray-100 p-4 rounded-lg mt-8">
            <h2 className="text-xl font-semibold">Section 3: Health & Healthcare</h2>
            <p className="text-gray-600 mt-1">Let's capture your health information.</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Do you have a primary care physician?
                </label>
                <select
                  name="hasPrimaryCarePhysician"
                  value={formData.hasPrimaryCarePhysician}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>
            </div>

            {formData.hasPrimaryCarePhysician === "true" && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="mb-4 font-semibold">Name of Doctor</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <input
                      type="text"
                      name="primaryFirst_name"
                      placeholder="First Name"
                      value={formData.primaryFirst_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="primaryLast_name"
                      placeholder="Last Name"
                      value={formData.primaryLast_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-4 font-semibold">Address of Doctor</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <select
                      name="primaryCountry"
                      value={formData.primaryCountry}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="United States">United States</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address Line 1</label>
                    <input
                      type="text"
                      name="primaryAddressline1"
                      placeholder="Address Line 1 (required)"
                      value={formData.primaryAddressline1}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address Line 2</label>
                    <input
                      type="text"
                      name="primaryAddressline2"
                      placeholder="Address Line 2"
                      value={formData.primaryAddressline2}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      name="primaryCity"
                      placeholder="City (required)"
                      value={formData.primaryCity}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input
                      type="text"
                      name="primaryState"
                      placeholder="State (required)"
                      value={formData.primaryState}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code</label>
                    <input
                      type="text"
                      name="primaryZip_code"
                      placeholder="ZIP Code (required)"
                      value={formData.primaryZip_code}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="text"
                      name="primaryPhonenumber"
                      placeholder="Phone Number of Doctor"
                      value={formData.primaryPhonenumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Do you have an OB/GYN?
                </label>
                <select
                  name="hasOBGYN"
                  value={formData.hasOBGYN}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>
            </div>

            {formData.hasOBGYN === "true" && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="mb-4 font-semibold">Name of Doctor</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <input
                      type="text"
                      name="obgynFirst_name"
                      placeholder="First Name"
                      value={formData.obgynFirst_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="obgynLast_name"
                      placeholder="Last Name"
                      value={formData.obgynLast_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-4 font-semibold">Address of Doctor</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <select
                      name="obgynCountry"
                      value={formData.obgynCountry}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="United States">United States</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address Line 1</label>
                    <input
                      type="text"
                      name="obgynAddressline1"
                      placeholder="Address Line 1 (required)"
                      value={formData.obgynAddressline1}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address Line 2</label>
                    <input
                      type="text"
                      name="obgynAddressline2"
                      placeholder="Address Line 2"
                      value={formData.obgynAddressline2}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      name="obgynCity"
                      placeholder="City (required)"
                      value={formData.obgynCity}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input
                      type="text"
                      name="obgynState"
                      placeholder="State (required)"
                      value={formData.obgynState}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code</label>
                    <input
                      type="text"
                      name="obgynZip_code"
                      placeholder="ZIP Code (required)"
                      value={formData.obgynZip_code}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="text"
                      name="obgynPhonenumber"
                      placeholder="Phone Number of Doctor"
                      value={formData.obgynPhonenumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Who is your Insurance Provider?
                </label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Do you consume alcohol or smoke?
                </label>
                <select
                  name="consumesAlcoholOrSmokes"
                  value={formData.consumesAlcoholOrSmokes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Setup</h1>
      <form onSubmit={handleSubmit}>
        {/* Your existing form fields go here */}
        
        {/* Medications Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Are you currently on any medications?
          </label>
          
          <div className="flex gap-4 mb-4">
            {/* Add Medication 1 Button */}
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                medications.some(med => med.type === 1) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
              onClick={handleAddMedication1}
              disabled={medications.some(med => med.type === 1)}
            >
              Add Medication 1
            </button>
            
            {/* Add Medication 2 Button */}
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                medications.some(med => med.type === 2) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
              onClick={handleAddMedication2}
              disabled={medications.some(med => med.type === 2)}
            >
              Add Medication 2
            </button>
          </div>

          {/* Medication Forms */}
          {medications.map((med, index) => (
            <div key={med.type} className="mt-4 p-4 bg-gray-50 rounded-lg relative">
              <h3 className="text-lg font-medium mb-4">Medication {med.type}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Medication Name"
                    value={med.name}
                    onChange={(e) => handleMedicationInputChange(index, "name", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Dosage</label>
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => handleMedicationInputChange(index, "dosage", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <input
                    type="text"
                    placeholder="Frequency"
                    value={med.frequency}
                    onChange={(e) => handleMedicationInputChange(index, "frequency", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              {/* Remove button for each medication */}
              <button
                type="button"
                onClick={() => handleRemoveMedication(med.type)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                aria-label={`Remove medication ${med.type}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </form>
    </div>
          </div>

          {/* Lifestyle Section */}
          <div className="bg-gray-100 p-4 rounded-lg mt-8">
            <h2 className="text-xl font-semibold">Section 4: Lifestyle & Preferences</h2>
            <p className="text-gray-600 mt-1">Help us understand your personal preferences and lifestyle.</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What is your preferred language for medical advice and resources?
                </label>
                <input
                  type="text"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Do you follow any specific dietary preferences or restrictions?
                </label>
                <input
                  type="text"
                  name="dietaryPreferences"
                  value={formData.dietaryPreferences}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Do you currently exercise or engage in physical activity during pregnancy?
                </label>
                <input
                  type="text"
                  name="physicalActivity"
                  value={formData.physicalActivity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What is your primary source of information during pregnancy?
                </label>
                <input
                  type="text"
                  name="primaryInfoSource"
                  value={formData.primaryInfoSource}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Support System Section */}
          <div className="bg-gray-100 p-4 rounded-lg mt-8">
            <h2 className="text-xl font-semibold">Section 5: Support System</h2>
            <p className="text-gray-600 mt-1">We'd like to hear about your expectations and any concerns you may have.</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What do you expect most from the Platform?
                </label>
                <input
                  type="text"
                  name="expectations"
                  value={formData.expectations}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Are there any specific challenges or concerns you would like support with?
                </label>
                <input
                  type="text"
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Would you like to receive personalized resources, tips, or reminders based on your profile?
                </label>
                <select
                  name="wantsPersonalizedResources"
                  value={formData.wantsPersonalizedResources}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Any additional comments or feedback for us?
                </label>
                <textarea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8 pb-12">
            <button
              type="submit"
              className="bg-purple-600 text-white px-12 py-3 rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;

















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
