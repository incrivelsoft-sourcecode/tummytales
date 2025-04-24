import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ProfileDisplay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpens, setIsOpens] = useState(false);
  const [isopens, setIsopens] = useState(false);
  const [isopen, setIsopen] = useState(false);
  const [formData, setFormData] = useState({
    currentlyPregnant: '',
    Last_menstrualperiod: '',
    estimatedDueDate: '',
    PregnancyLoss: '',
    firstChild: '',
    hasPrimaryCarePhysician: '',
    insuranceProvider: '',
    consumesAlcoholOrSmokes: '',
    navigationExperience: '',
  });
  const [progress, setProgress] = useState(0);
  const [value, setValue] = useState(0);
  const [item, setItem] = useState(0);
  const [type, setType] = useState(0);
  const [use, setUse] = useState(0);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    const total = Object.values(formData).filter((val) => val !== '').length;
    setProgress(Math.floor((total / 5) * 100));
  }, [formData]);

  useEffect(() => {
    const fields = Object.values(formData);
    const filledFields = fields.filter((val) => val !== '').length;
    const percent = Math.round((filledFields / fields.length) * 100);
    setProgress(percent);
  }, [formData]);

  const handleChanges = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [medications, setMedications] = useState([]);
  const [medicationAdded, setMedicationAdded] = useState(false);
  
  const handleAddMedication = () => {
    if (!medicationAdded) {
      setMedications([{ name: '', dosage: '', frequency: '' }]);
      setMedicationAdded(true); // Prevent adding again
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };
  

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">PROFILE - Priya96</h1>
      <p className="mb-6 text-gray-700">
        Complete this profile to help us curate the best experience for you. Don’t worry—feel free to return and update it anytime. Keeping it up to date will ensure you get the most relevant and personalized support throughout your journey.
      </p>

      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="font-semibold text-lg">Section 1: General Details</h2>
        <p className="text-gray-600">Let’s start with some basic information to get to know you better.</p>
      </div>

      <form className="space-y-6">
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
      </form>
      <div className="mt-6 bg-[#f4f4f4] p-4 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg">Section 2: Pregnancy Status</h2>
          <p className="text-gray-600 text-sm">Let’s know about your pregnancy journey.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full font-semibold">
            {value} % complete
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-sm"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}    
          </button>
        </div>
      </div>

      {isOpen && (
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
      )}
    </div>
    <section className="mt-6">
      <div className="bg-gray-100 p-4 rounded-md flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-black">Section 3: Health & Healthcare</h3>
          <p className="text-gray-500 text-sm">Understanding your experience with healthcare during pregnancy.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-purple-300 text-purple-900 text-sm font-semibold px-3 py-1 rounded-full">
            {item} % complete
          </span>
          <button
            onClick={() => setIsOpens(!isOpens)}
            className="bg-black rounded-full w-6 h-6 flex items-center justify-center text-white"
          >
            {isOpens ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpens && (
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
      <button
        className="bg-black text-white py-2 px-4 w-fit mb-4"
        onClick={handleAddMedication}
      >
        Add Medication
      </button>

      {medications.map((med, index) => (
        <div key={index} className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={med.name}
            onChange={(e) => handleInputChange(index, "name", e.target.value)}
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Dosage"
            value={med.dosage}
            onChange={(e) => handleInputChange(index, "dosage", e.target.value)}
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Frequency"
            value={med.frequency}
            onChange={(e) => handleInputChange(index, "frequency", e.target.value)}
            className="border p-2 w-full"
          />
        </div>
      ))}
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
      )}
    </section>
    <section className="mt-6">
      <div className="bg-gray-100 p-4 rounded-md flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-black">Section 4: Lifestyle & Preferences</h3>
          <p className="text-gray-500 text-sm">
            Help us understand your personal preferences and lifestyle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-purple-300 text-purple-900 text-sm font-semibold px-3 py-1 rounded-full">
            {type} % complete
          </span>
          <button
            onClick={() => setIsopens(!isopens)}
            className="bg-black rounded-full w-6 h-6 flex items-center justify-center text-white"
          >
            {isopens ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isopens && (
        <div className="mt-4 space-y-4 px-4 py-3 border border-gray-200 rounded-md bg-white">
          <div>
            <label className="block font-medium">
              What is your preferred language for medical advice and resources?
            </label>
            <input
              type="text"
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChanges}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium">
              Do you follow any specific dietary preferences or restrictions?
            </label>
            <input
              type="text"
              name="dietaryPreferences"
              value={formData.dietaryPreferences}
              onChange={handleChanges}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium">
              Do you currently exercise or engage in physical activity during pregnancy?
            </label>
            <input
              type="text"
              name="exerciseDuringPregnancy"
              value={formData.exerciseDuringPregnancy}
              onChange={handleChanges}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block font-medium">
              What is your primary source of information during pregnancy?
            </label>
            <input
              type="text"
              name="infoSourceDuringPregnancy"
              value={formData.infoSourceDuringPregnancy}
              onChange={handleChanges}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>
      )}
    </section>
    <section className="mt-6">
  <div className="bg-gray-100 p-4 rounded-md flex justify-between items-center">
    <div>
      <h3 className="font-semibold text-black">Section 5: Your Experience and Expectations</h3>
      <p className="text-gray-500 text-sm">
        We’d like to hear about your expectations and any concerns you may have.
      </p>
    </div>

    <div className="flex items-center gap-3">
      <span className="bg-purple-300 text-purple-900 text-sm font-semibold px-3 py-1 rounded-full">
        {use} % complete
      </span>
      <button
        onClick={() => setIsopen(!isopen)}
        className="bg-black rounded-full w-6 h-6 flex items-center justify-center text-white"
      >
        {isopen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  </div>

  {isopen && (
    <div className="mt-4 space-y-4 px-4 py-3 border border-gray-200 rounded-md bg-white">
      <div>
        <label className="block font-medium">
          What do you expect most from this platform?
        </label>
        <input
          type="text"
          name="platformExpectations"
          value={formData.platformExpectations}
          onChange={handleChanges}
          className="mt-1 w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <div>
        <label className="block font-medium">
          Are there any specific challenges or concerns you would like support with?
        </label>
        <input
          type="text"
          name="challengesOrConcerns"
          value={formData.challengesOrConcerns}
          onChange={handleChanges}
          className="mt-1 w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <div>
        <label className="block font-medium">
          Would you like to receive personalized resources, tips, or reminders based on your profile?
        </label>
        <input
          type="text"
          name="personalizedResources"
          value={formData.personalizedResources}
          onChange={handleChanges}
          className="mt-1 w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <div>
        <label className="block font-medium">
          Any additional comments or feedback for us?
        </label>
        <input
          type="text"
          name="additionalFeedback"
          value={formData.additionalFeedback}
          onChange={handleChanges}
          className="mt-1 w-full border border-gray-300 rounded-md p-2"
        />
      </div>
    </div>
  )}
</section>

    </div>
  );
};

export default ProfileDisplay;







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

