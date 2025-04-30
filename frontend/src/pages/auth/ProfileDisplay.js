import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ProfileForm = () => {
  const [formData, setFormData] = useState({
    // General Details
    first_name: '',
    last_name: '',
    dob: '',
    gender: '',
    nationality: '',
    Phonenumber: '',
    email: '',
    country: '',
    Addressline1: '',
    Addressline2: '',
    city: '',
    State: '',
    Zip_code: '',

    // Pregnancy Status
    currentlyPregnant: '',
    Last_menstrualperiod: '',
    estimatedDueDate: '',
    PregnancyLoss: '',
    dateOfLoss: '',
    reason: '',
    gestationWeeks: '',
    treatmentLocation: '',
    firstChild: '',
    firstChildDob: '',
    complications: '',
    deliverymethod: '',
    childbornlocation: '',
    gestationalAgeAtBirth: '',

    // Healthcare
    hasPrimaryCarePhysician: '',
    primaryFirst_name: '',
    primaryLast_name: '',
    primaryAddressline1: '',
    primaryAddressline2: '',
    primaryCity: '',
    primaryState: '',
    primaryZip_code: '',
    insuranceProvider: '',
    consumesAlcoholOrSmokes: '',

    // Lifestyle
    preferredLanguage: '',
    dietaryPreferences: '',
    exerciseDuringPregnancy: '',
    infoSourceDuringPregnancy: '',

    // Experience
    platformExpectations: '',
    challengesOrConcerns: '',
    personalizedResources: '',
    additionalFeedback: '',
  });

  const [sections, setSections] = useState({
    general: false,
    pregnancy: false,
    healthcare: false,
    lifestyle: false,
    experience: false
  });

  const [medications, setMedications] = useState([]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const toggleSection = (section) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const calculateProgress = (fields) => {
    const filledFields = fields.filter(
      (field) => formData[field] && formData[field] !== ""
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Profile Updated Successfully!");
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

  const handleRemoveMedication = (type) => {
    setMedications(medications.filter(med => med.type !== type));
  };

  const handleInputChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setMedications(updatedMedications);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PROFILE - Priya96</h1>
        <p className="text-gray-600">
          Complete this profile to help us curate the best experience for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Details Section */}
        <div className="bg-gray-100 p-4 rounded mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Section 1: General Details</h2>
              <p className="text-gray-600">Basic information to get to know you better.</p>
            </div>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={() => toggleSection('general')}
            >
              {sections.general ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {sections.general && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Mobile Phone Number</label>
                  <input
                    type="tel"
                    name="Phonenumber"
                    value={formData.Phonenumber}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-yellow-50 p-6 rounded-md">
                <h3 className="text-lg font-semibold mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                    >
                      <option value="">Select Country</option>
                      <option value="United States">United States</option>
                      <option value="India">India</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Address Line 1</label>
                    <input
                      type="text"
                      name="Addressline1"
                      value={formData.Addressline1}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Address Line 2</label>
                    <input
                      type="text"
                      name="Addressline2"
                      value={formData.Addressline2}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">State</label>
                      <input
                        type="text"
                        name="State"
                        value={formData.State}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">ZIP Code</label>
                      <input
                        type="text"
                        name="Zip_code"
                        value={formData.Zip_code}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pregnancy Status Section */}
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Section 2: Pregnancy Status</h2>
              <p className="text-gray-600">Information about your pregnancy journey.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress([
                    'currentlyPregnant',
                    'Last_menstrualperiod',
                    'estimatedDueDate',
                    'PregnancyLoss',
                    'firstChild'
                  ])}%` }}
                ></div>
              </div>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection('pregnancy')}
              >
                {sections.pregnancy ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.pregnancy && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium">Are you currently pregnant?</label>
                <select
                  name="currentlyPregnant"
                  value={formData.currentlyPregnant}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Last Menstrual Period</label>
                <input
                  type="date"
                  name="Last_menstrualperiod"
                  value={formData.Last_menstrualperiod}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Estimated Due Date</label>
                <input
                  type="date"
                  name="estimatedDueDate"
                  value={formData.estimatedDueDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Have you experienced pregnancy loss?</label>
                <select
                  name="PregnancyLoss"
                  value={formData.PregnancyLoss}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {formData.PregnancyLoss === "Yes" && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-300">
                  <div>
                    <label className="block mb-1 font-medium">Date of Loss</label>
                    <input
                      type="date"
                      name="dateOfLoss"
                      value={formData.dateOfLoss}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Reason</label>
                    <select
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                    >
                      <option value="">Select an option</option>
                      <option value="Medical Issue">Medical Issue</option>
                      <option value="Accident">Accident</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1 font-medium">Is this your first child?</label>
                <select
                  name="firstChild"
                  value={formData.firstChild}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {formData.firstChild === "No" && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-300">
                  <div>
                    <label className="block mb-1 font-medium">First Child's Date of Birth</label>
                    <input
                      type="date"
                      name="firstChildDob"
                      value={formData.firstChildDob}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Were there any complications?</label>
                    <textarea
                      name="complications"
                      value={formData.complications}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Healthcare Section */}
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Section 3: Healthcare</h2>
              <p className="text-gray-600">Your healthcare information.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress([
                    'hasPrimaryCarePhysician',
                    'insuranceProvider',
                    'consumesAlcoholOrSmokes'
                  ])}%` }}
                ></div>
              </div>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection('healthcare')}
              >
                {sections.healthcare ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.healthcare && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium">Do you have a primary care physician?</label>
                <select
                  name="hasPrimaryCarePhysician"
                  value={formData.hasPrimaryCarePhysician}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Select an option</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {formData.hasPrimaryCarePhysician === "true" && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">Doctor's First Name</label>
                      <input
                        type="text"
                        name="primaryFirst_name"
                        value={formData.primaryFirst_name}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Doctor's Last Name</label>
                      <input
                        type="text"
                        name="primaryLast_name"
                        value={formData.primaryLast_name}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block mb-1 font-medium">Doctor's Address</label>
                    <input
                      type="text"
                      name="primaryAddressline1"
                      value={formData.primaryAddressline1}
                      onChange={handleChange}
                      placeholder="Address Line 1"
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="text"
                      name="primaryAddressline2"
                      value={formData.primaryAddressline2}
                      onChange={handleChange}
                      placeholder="Address Line 2"
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="primaryCity"
                        value={formData.primaryCity}
                        onChange={handleChange}
                        placeholder="City"
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                      <input
                        type="text"
                        name="primaryState"
                        value={formData.primaryState}
                        onChange={handleChange}
                        placeholder="State"
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                      <input
                        type="text"
                        name="primaryZip_code"
                        value={formData.primaryZip_code}
                        onChange={handleChange}
                        placeholder="ZIP Code"
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1 font-medium">Insurance Provider</label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

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
                          onChange={(e) => handleInputChange(index, "name", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Dosage</label>
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => handleInputChange(index, "dosage", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Frequency</label>
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={med.frequency}
                          onChange={(e) => handleInputChange(index, "frequency", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

              <div>
                <label className="block mb-1 font-medium">Do you consume alcohol or smoke?</label>
                <select
                  name="consumesAlcoholOrSmokes"
                  value={formData.consumesAlcoholOrSmokes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Select an option</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lifestyle Section */}
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Section 4: Lifestyle</h2>
              <p className="text-gray-600">Your lifestyle preferences.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress([
                    'preferredLanguage',
                    'dietaryPreferences',
                    'exerciseDuringPregnancy',
                    'infoSourceDuringPregnancy'
                  ])}%` }}
                ></div>
              </div>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection('lifestyle')}
              >
                {sections.lifestyle ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.lifestyle && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium">Preferred Language</label>
                <input
                  type="text"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Dietary Preferences</label>
                <textarea
                  name="dietaryPreferences"
                  value={formData.dietaryPreferences}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block mb-1 font-medium">Exercise During Pregnancy</label>
                <textarea
                  name="exerciseDuringPregnancy"
                  value={formData.exerciseDuringPregnancy}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block mb-1 font-medium">Primary Information Source</label>
                <input
                  type="text"
                  name="infoSourceDuringPregnancy"
                  value={formData.infoSourceDuringPregnancy}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">Section 5: Experience</h2>
              <p className="text-gray-600">Your expectations and feedback.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress([
                    'platformExpectations',
                    'challengesOrConcerns',
                    'personalizedResources',
                    'additionalFeedback'
                  ])}%` }}
                ></div>
              </div>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection('experience')}
              >
                {sections.experience ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.experience && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium">Platform Expectations</label>
                <textarea
                  name="platformExpectations"
                  value={formData.platformExpectations}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block mb-1 font-medium">Challenges or Concerns</label>
                <textarea
                  name="challengesOrConcerns"
                  value={formData.challengesOrConcerns}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block mb-1 font-medium">Would you like personalized resources?</label>
                <select
                  name="personalizedResources"
                  value={formData.personalizedResources}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Additional Feedback</label>
                <textarea
                  name="additionalFeedback"
                  value={formData.additionalFeedback}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                ></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;




// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";


// const ProfileDisplay = () => {
//   const { id: profileId } = useParams();
//   const navigate = useNavigate();
//   const [profile, setProfile] = useState(null);
//   const [editableProfile, setEditableProfile] = useState(null);
//   const [editingField, setEditingField] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [expandedSections, setExpandedSections] = useState({
//     general: true,
//     pregnancy: true,
//     health: true,
//     lifestyle: true,
//     support: true,
//   });

//   const user_name = localStorage.getItem("userName") || "";

//   useEffect(() => {
//     if (profileId) {
//       fetchProfile(profileId);
//     } else {
//       toast.error("No profile ID found. Please create a profile first.");
//       navigate("/profile-setup");
//     }
//   }, [profileId]);

//   const fetchProfile = async (id) => {
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_BACKEND_URL}/mom/survey/${id}?user_name=${user_name}`
//       );

//       if (res.status === 200) {
//         const profileData = res.data.survey;
//         if (!profileData) {
//           toast.error("No profile data found.");
//           return;
//         }

//         const formattedProfile = {
//           ...profileData.generalDetails,
//           ...profileData.pregnancyStatus,
//           ...profileData.healthCare,
//           ...profileData.lifestylePreferences,
//           ...profileData.experienceAndExpectations,
//         };

//         setProfile(formattedProfile);
//         setEditableProfile(formattedProfile);
//       }
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//       toast.error("Failed to load profile data.");
//     }
//   };

//   const toggleSection = (section) => {
//     setExpandedSections((prev) => ({
//       ...prev,
//       [section]: !prev[section],
//     }));
//   };

//   const handleDoubleClick = (fieldName) => {
//     setIsEditing(true);
//     setEditingField(fieldName);
//   };

//   const handleChange = (e, fieldName) => {
//     setEditableProfile({
//       ...editableProfile,
//       [fieldName]: e.target.value,
//     });
//   };

//   const handleSave = async () => {
//     try {
//       const updatedProfile = {
//         generalDetails: {
//           full_name: editableProfile.full_name,
//           age: editableProfile.age,
//           gender: editableProfile.gender,
//           nationality: editableProfile.nationality,
//           generation: editableProfile.generation,
//         },
//         pregnancyStatus: {
//           currentlyPregnant: editableProfile.currentlyPregnant,
//           firstPregnancy: editableProfile.firstPregnancy,
//           pregnancyWeeks: editableProfile.pregnancyWeeks,
//           estimatedDueDate: editableProfile.estimatedDueDate,
//         },
//         healthCare: {
//           hasProvider: editableProfile.hasProvider,
//           prenatalServices: editableProfile.prenatalServices,
//           healthcareSystem: editableProfile.healthcareSystem,
//           navigationExperience: editableProfile.navigationExperience,
//           culturalChallenges: editableProfile.culturalChallenges,
//         },
//         lifestylePreferences: {
//           preferredLanguage: editableProfile.preferredLanguage,
//           dietaryPreferences: editableProfile.dietaryPreferences,
//           physicalActivity: editableProfile.physicalActivity,
//           primaryInfoSource: editableProfile.primaryInfoSource,
//           wantsPersonalizedResources: editableProfile.wantsPersonalizedResources,
//         },
//         experienceAndExpectations: {
//           expectations: editableProfile.expectations,
//           challenges: editableProfile.challenges,
//           additionalComments: editableProfile.additionalComments,
//         },
//       };
 
//       const res = await axios.put(
//         `${process.env.REACT_APP_BACKEND_URL}/mom/update/${profileId}`,
//         {
//           user_name,
//           ...updatedProfile,
//         }
//       );
 
//       if (res.status === 200) {
//         setProfile(editableProfile);
//         setIsEditing(false);
//         setEditingField(null);
//         toast.success("Profile updated successfully");
//       } else {
//         toast.error("Failed to update profile");
//       }
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       toast.error("Error updating profile");
//     }
//   };
 

//   const fields = {
//     general: ["full_name", "age", "gender", "nationality", "generation"],
//     pregnancy: ["currentlyPregnant", "pregnancyWeeks", "estimatedDueDate", "firstPregnancy"],
//     health: ["hasProvider", "prenatalServices", "healthcareSystem", "navigationExperience", "culturalChallenges"],
//     lifestyle: ["preferredLanguage", "dietaryPreferences", "physicalActivity", "primaryInfoSource"],
//     support: ["expectations", "challenges", "wantsPersonalizedResources", "additionalComments"],
//   };

//   const calculateCompletion = (sectionFields) => {
//     if (!editableProfile) return 0;

//     const filledFields = sectionFields.filter((field) => {
//       const value = editableProfile[field];
//       return value !== null && value !== undefined && value !== "" && value !== false;
//     }).length;

//     return Math.round((filledFields / sectionFields.length) * 100);
//   };

//   const completions = {
//     pregnancy: calculateCompletion(fields.pregnancy),
//     health: calculateCompletion(fields.health),
//     lifestyle: calculateCompletion(fields.lifestyle),
//     support: calculateCompletion(fields.support),
//   };

//   if (!profile) return <p className="text-center text-gray-600">Loading...</p>;

//   const renderField = (fieldName, value) => {
//     if (isEditing && editingField === fieldName) {
//       return (
//         <input
//           type="text"
//           value={value || ""}
//           onChange={(e) => handleChange(e, fieldName)}
//           onBlur={() => setEditingField(null)}
//           className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//           autoFocus
//         />
//       );
//     }
//     return (
//       <div onDoubleClick={() => handleDoubleClick(fieldName)} className="cursor-pointer">
//         {value || "Not provided"}
//       </div>
//     );
//   };

//   const renderSectionHeader = (title, subtitle, completion, sectionKey) => (
//     <div
//       className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg"
//       onClick={() => toggleSection(sectionKey)}
//     >
//       <div>
//         <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
//         <p className="text-gray-500 mt-1">{subtitle}</p>
//       </div>
//       {sectionKey !== "general" && (
//         <div className="flex items-center">
//           <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-4">
//             <div
//               className="bg-purple-600 h-2.5 rounded-full"
//               style={{ width: `${completion}%` }}
//             ></div>
//           </div>
//           <span className="text-sm font-medium text-gray-700">{completion}% complete</span>
//         </div>
//       )}
//       <svg
//         className={`w-5 h-5 ml-4 text-gray-500 transition-transform ${
//           expandedSections[sectionKey] ? "rotate-180" : ""
//         }`}
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//       </svg>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gray-100 flex justify-center p-6">
//       <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
//         <h1 className="text-2xl font-bold text-gray-800">PROFILE - {profile.full_name}</h1>

//         {Object.keys(fields).map((sectionKey) => (
//           <section key={sectionKey} className="mt-6">
//             {renderSectionHeader(
//               `Section: ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`,
//               "Expand to edit your details.",
//               completions[sectionKey],
//               sectionKey
//             )}
//             {expandedSections[sectionKey] && (
//               <div className="space-y-2 mt-4">
//                 <div className="grid grid-cols-1">
//                   {fields[sectionKey].map((field) => (
//                     <div key={field} className="py-2">
//                       <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//                         {field.replace(/([A-Z])/g, " $1")}
//                       </h3>
//                       <div className="mt-1 p-2 bg-gray-50 rounded">
//                         <p className="text-sm text-gray-900">
//                           {renderField(field, editableProfile?.[field])}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </section>
//         ))}

//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition"
//           >
//             Save Changes
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDisplay;

