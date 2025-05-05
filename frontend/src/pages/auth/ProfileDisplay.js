import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; //  add this at the top with other imports

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ProfileForm = () => {
   const { id } = useParams();
    console.log("Profile ID:", id);
  const userId = localStorage.getItem("userId") || "";
    
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
    hasOBGYN: '',
    obgynFirst_name: "",
    obgynLast_name: "",
    obgynCountry: "",
    obgynAddressline1: "",
    obgynAddressline2: "",
    obgynCity: "",
    obgynState: "",
    obgynZip_code: "",
    obgynPhonenumber: "",
   
    insuranceProvider: '',
    medication1Name: "",
    medication1Dosage: "",
    medication1Frequency: "",
    medication2Name: "",
    medication2Dosage: "",
    medication2Frequency: "",
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

  useEffect(() => {
      if (!id || !userId) return;
      
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}/mom/survey/${id}?userId=${userId}`)
        .then((res) => {
          if (res.data && res.data.survey) {
            const survey = res.data.survey;
            
            // Mapping the response to the formData state
            setFormData({
              // General Details
              first_name: survey.generalDetails.first_name || '',
              last_name: survey.generalDetails.last_name || '',
              dob: survey.generalDetails.dob ? survey.generalDetails.dob.split('T')[0] : '', // formatting the date
              gender: survey.generalDetails.gender || '',
              nationality: survey.generalDetails.nationality || '',
              Phonenumber: survey.generalDetails.Phonenumber || '',
              email: survey.generalDetails.email || '',
              country: survey.generalDetails.country || '',
              Addressline1: survey.generalDetails.Addressline1 || '',
              Addressline2: survey.generalDetails.Addressline2 || '',
              city: survey.generalDetails.city || '',
              State: survey.generalDetails.State || '',
              Zip_code: survey.generalDetails.Zip_code || '',
    
              // Pregnancy Status
              currentlyPregnant: survey.pregnancyStatus.currentlyPregnant || '',
              Last_menstrualperiod: survey.pregnancyStatus.Last_menstrualperiod || '',
              estimatedDueDate: survey.pregnancyStatus.estimatedDueDate || '',
              PregnancyLoss: survey.pregnancyStatus.PregnancyLoss || '',
              dateOfLoss: survey.pregnancyStatus.dateOfLoss || '',
              reason: survey.pregnancyStatus.reason || '',
              gestationWeeks: survey.pregnancyStatus.gestationWeeks || '',
              treatmentLocation: survey.pregnancyStatus.treatmentLocation || '',
              firstChild: survey.pregnancyStatus.firstChild || '',
              firstChildDob: survey.pregnancyStatus.firstChildDob || '',
              complications: survey.pregnancyStatus.complications || '',
              deliverymethod: survey.pregnancyStatus.deliverymethod || '',
              childbornlocation: survey.pregnancyStatus.childbornlocation || '',
              gestationalAgeAtBirth: survey.pregnancyStatus.gestationalAgeAtBirth || '',
    
              // Healthcare
              hasPrimaryCarePhysician: survey.healthCare.primaryCare.hasPrimaryCarePhysician || '',
              primaryFirst_name: survey.healthCare.primaryCare.details.first_name || '',
              primaryLast_name: survey.healthCare.primaryCare.details.last_name || '',
              primaryAddressline1: survey.healthCare.primaryCare.details.Addressline1 || '',
              primaryAddressline2: survey.healthCare.primaryCare.details.Addressline2 || '',
              primaryCity: survey.healthCare.primaryCare.details.city || '',
              primaryState: survey.healthCare.primaryCare.details.State || '',
              primaryZip_code: survey.healthCare.primaryCare.details.Zip_code || '',
              hasOBGYN: survey.healthCare.obgyn.hasOBGYN || '',
              obgynFirst_name: survey.healthCare.obgyn.details.first_name || '',
              obgynLast_name: survey.healthCare.obgyn.details.last_name || '',
              obgynCountry: survey.healthCare.obgyn.details.country || '',
              obgynAddressline1: survey.healthCare.obgyn.details.Addressline1 || '',
              obgynAddressline2: survey.healthCare.obgyn.details.Addressline2 || '',
              obgynCity: survey.healthCare.obgyn.details.city || '',
              obgynState: survey.healthCare.obgyn.details.State || '',
              obgynZip_code: survey.healthCare.obgyn.details.Zip_code || '',
              obgynPhonenumber: survey.healthCare.obgyn.details.Phonenumber || '',
    
              insuranceProvider: survey.healthCare.insuranceProvider || '',
              medication1Name: survey.healthCare.medication1.name || '',
              medication1Dosage: survey.healthCare.medication1.dosage || '',
              medication1Frequency: survey.healthCare.medication1.frequency || '',
              medication2Name: survey.healthCare.medication2.name || '',
              medication2Dosage: survey.healthCare.medication2.dosage || '',
              medication2Frequency: survey.healthCare.medication2.frequency || '',
              consumesAlcoholOrSmokes: survey.healthCare.consumesAlcoholOrSmokes || '',
    
              // Lifestyle
              preferredLanguage: survey.lifestylePreferences.preferredLanguage || '',
              dietaryPreferences: survey.lifestylePreferences.dietaryPreferences || '',
              exerciseDuringPregnancy: survey.lifestylePreferences.physicalActivity || '',
              infoSourceDuringPregnancy: survey.lifestylePreferences.primaryInfoSource || '',
    
              // Experience
              platformExpectations: survey.experienceAndExpectations.expectations || '',
              challengesOrConcerns: survey.experienceAndExpectations.challenges || '',
              personalizedResources: survey.experienceAndExpectations.wantsPersonalizedResources || '',
              additionalFeedback: survey.experienceAndExpectations.additionalComments || '',
            });
          }
        })
        .catch((err) => {
          console.error("Error fetching survey by ID:", err);
        });
    }, [id, userId]);


    const handleSubmit = (e) => {
      e.preventDefault();
    
      const updatedData = {
        userId: userId,
        generalDetails: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          dob: formData.dob,
          gender: formData.gender,
          nationality: formData.nationality,
          Phonenumber: formData.Phonenumber,
          email: formData.email,
          country: formData.country,
          Addressline1: formData.Addressline1,
          Addressline2: formData.Addressline2,
          city: formData.city,
          State: formData.State,
          Zip_code: formData.Zip_code,
        },
        pregnancyStatus: {
          currentlyPregnant: !!formData.currentlyPregnant, // default false
          Last_menstrualperiod: formData.Last_menstrualperiod,
          estimatedDueDate: formData.estimatedDueDate,
          PregnancyLossInfo: {
            hasPregnancyLoss: !!formData.PregnancyLoss, // default false
            details: {
              dateOfLoss: formData.dateOfLoss,
              reason: formData.reason,
              gestationWeeks: formData.gestationWeeks,
              treatmentLocation: formData.treatmentLocation,
            },
          },
          firstChildInfo: {
            isFirstChild: !!formData.firstChild, // default false
            details: {
              dob: formData.firstChildDob,
              complications: formData.complications,
              deliverymethod: formData.deliverymethod,
              childbornlocation: formData.childbornlocation,
              gestationalAgeAtBirth: formData.gestationalAgeAtBirth,
            },
          },
        },
        healthCare: {
          primaryCare: {
            hasPrimaryCarePhysician: !!formData.hasPrimaryCarePhysician, // default false
            details: {
              first_name: formData.primaryFirst_name,
              last_name: formData.primaryLast_name,
              country: formData.primaryCountry,
              Addressline1: formData.primaryAddressline1,
              Addressline2: formData.primaryAddressline2,
              city: formData.primaryCity,
              State: formData.primaryState,
              Zip_code: formData.primaryZip_code,
              Phonenumber: formData.primaryPhonenumber,
            },
          },
          obgyn: {
            hasOBGYN: !!formData.hasOBGYN, // default false
            details: {
              first_name: formData.obgynFirst_name,
              last_name: formData.obgynLast_name,
              country: formData.obgynCountry,
              Addressline1: formData.obgynAddressline1,
              Addressline2: formData.obgynAddressline2,
              city: formData.obgynCity,
              State: formData.obgynState,
              Zip_code: formData.obgynZip_code,
              Phonenumber: formData.obgynPhonenumber,
            },
          },
          medication1: {
            name: formData.medication1Name,
            dosage: formData.medication1Dosage,
            frequency: formData.medication1Frequency,
          },
          medication2: {
            name: formData.medication2Name,
            dosage: formData.medication2Dosage,
            frequency: formData.medication2Frequency,
          },
          insuranceProvider: formData.insuranceProvider,
          consumesAlcoholOrSmokes: !!formData.consumesAlcoholOrSmokes, // default false
        },
        lifestylePreferences: {
          preferredLanguage: formData.preferredLanguage,
          dietaryPreferences: formData.dietaryPreferences,
          physicalActivity: formData.exerciseDuringPregnancy,
          primaryInfoSource: formData.infoSourceDuringPregnancy,
        },
        experienceAndExpectations: {
          expectations: formData.platformExpectations,
          challenges: formData.challengesOrConcerns,
          wantsPersonalizedResources: !!formData.personalizedResources, // default false
          additionalComments: formData.additionalFeedback,
        },
      };
    
      axios
        .put(`${process.env.REACT_APP_BACKEND_URL}/mom/update/${id}`, updatedData)
        .then((res) => {
          if (res.data && res.data.message) {
            toast.success("Updated successfully!");
            console.log(res.data.message);
          }else {
            toast.error("Update failed. Please try again."); // ❌ If no success message
          }
        })
        .catch((err) => {
          console.error('Error updating survey:', err);
          toast.error("Failed to update. Something went wrong."); // ❌ Error popup
        });
    };
    
    
    
    
  

  
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
      (field) => formData[field] !== undefined && formData[field] !== null && formData[field] !== ""
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };
  
 

  const [showMedication1, setShowMedication1] = useState(false);
  const [showMedication2, setShowMedication2] = useState(false);
   
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        {/* <h1 className="text-3xl font-bold mb-2">PROFILE - P</h1> */}
        <h1 className="text-3xl font-bold mb-2">
          Profile{" "}
          {formData.first_name && formData.last_name
            ? `(${formData.first_name} ${formData.last_name})`
            : ""}
        </h1>

        <p className="text-gray-600">
          Complete this profile to help us curate the best experience for
          you.Don’t worry—feel free to return and update it anytime. Keeping it
          up to date will ensure you get the most relevant and personalized
          support throughout your journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
            <label className="block text-sm font-medium mb-2">
              Date of Birth
            </label>
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
            <label className="block text-sm font-medium mb-2">
              Nationality
            </label>
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
            <label className="block text-sm font-medium mb-2">
              Mobile Phone Number
            </label>
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

        {/* Pregnancy Status Section */}
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">
                Section 2: Pregnancy Status
              </h2>
              <p className="text-gray-600">
                Information about your pregnancy journey.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${calculateProgress([
                      "currentlyPregnant",
                      "Last_menstrualperiod",
                      "estimatedDueDate",
                      "PregnancyLoss",
                      "firstChild",
                    ])}%`,
                  }}
                ></div>
              </div>

              <span className="text-sm font-medium text-gray-700">
                {calculateProgress([
                  "currentlyPregnant",
                  "Last_menstrualperiod",
                  "estimatedDueDate",
                  "PregnancyLoss",
                  "firstChild",
                ])}
                %
              </span>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection("pregnancy")}
              >
                {sections.pregnancy ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.pregnancy && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium">
                  Are you currently pregnant?
                </label>
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
                <label className="block mb-1 font-medium">
                  Last Menstrual Period
                </label>
                <input
                  type="date"
                  name="Last_menstrualperiod"
                  value={formData.Last_menstrualperiod}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Estimated Due Date
                </label>
                <input
                  type="date"
                  name="estimatedDueDate"
                  value={formData.estimatedDueDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
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
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5 relative">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${calculateProgress([
                      // Primary Care
                      "hasPrimaryCarePhysician",
                      "primaryFirst_name",
                      "primaryLast_name",
                      "primaryAddressline1",
                      "primaryAddressline2",
                      "primaryCity",
                      "primaryState",
                      "primaryZip_code",
                      // OBGYN
                      "hasOBGYN",
                      "obgynFirst_name",
                      "obgynLast_name",
                      "obgynCountry",
                      "obgynAddressline1",
                      "obgynAddressline2",
                      "obgynCity",
                      "obgynState",
                      "obgynZip_code",
                      "obgynPhonenumber",
                      // Insurance
                      "insuranceProvider",
                      // Medications
                      "medication1Name",
                      "medication1Dosage",
                      "medication1Frequency",
                      "medication2Name",
                      "medication2Dosage",
                      "medication2Frequency",
                      // Habits
                      "consumesAlcoholOrSmokes",
                    ])}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {calculateProgress([
                  "hasPrimaryCarePhysician",
                  "primaryFirst_name",
                  "primaryLast_name",
                  "primaryAddressline1",
                  "primaryAddressline2",
                  "primaryCity",
                  "primaryState",
                  "primaryZip_code",
                  "hasOBGYN",
                  "obgynFirst_name",
                  "obgynLast_name",
                  "obgynCountry",
                  "obgynAddressline1",
                  "obgynAddressline2",
                  "obgynCity",
                  "obgynState",
                  "obgynZip_code",
                  "obgynPhonenumber",
                  "insuranceProvider",
                  "medication1Name",
                  "medication1Dosage",
                  "medication1Frequency",
                  "medication2Name",
                  "medication2Dosage",
                  "medication2Frequency",
                  "consumesAlcoholOrSmokes",
                ])}
                %
              </span>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection("healthcare")}
              >
                {sections.healthcare ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.healthcare && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 font-medium">
                  Do you have a primary care physician?
                </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Country
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Address Line 1
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Address Line 2
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        City
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        State
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        ZIP Code
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Phone Number
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Country
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Address Line 1
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Address Line 2
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        City
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        State
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        ZIP Code
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Phone Number
                      </label>
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

              <div>
                <label className="block mb-1 font-medium">
                  Insurance Provider
                </label>
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
                  <button
                    type="button"
                    onClick={() => setShowMedication1(true)}
                    disabled={showMedication1}
                    className={`px-4 py-2 rounded-md font-medium ${
                      showMedication1
                        ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    Add Medication 1
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMedication2(true)}
                    disabled={showMedication2}
                    className={`px-4 py-2 rounded-md font-medium ${
                      showMedication2
                        ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                        : "bg-black text-white"
                    }`}
                  >
                    Add Medication 2
                  </button>
                </div>

                {/* Medication 1 Section */}
                {showMedication1 && (
                  <div className="border border-gray-200 p-4 rounded-md mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Medication 1</h3>
                      <button
                        onClick={() => setShowMedication1(false)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Medication 1"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="medication1Name"
                          value={formData.medication1Name}
                          onChange={handleChange}
                          placeholder="Medication Name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Dosage
                        </label>
                        <input
                          type="text"
                          name="medication1Dosage"
                          value={formData.medication1Dosage}
                          onChange={handleChange}
                          placeholder="Dosage"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Frequency
                        </label>
                        <input
                          type="text"
                          name="medication1Frequency"
                          value={formData.medication1Frequency}
                          onChange={handleChange}
                          placeholder="Frequency"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Medication 2 Section */}
                {showMedication2 && (
                  <div className="border border-gray-200 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Medication 2</h3>
                      <button
                        onClick={() => setShowMedication2(false)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Medication 2"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="medication2Name"
                          value={formData.medication2Name}
                          onChange={handleChange}
                          placeholder="Medication Name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Dosage
                        </label>
                        <input
                          type="text"
                          name="medication2Dosage"
                          value={formData.medication2Dosage}
                          onChange={handleChange}
                          placeholder="Dosage"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Frequency
                        </label>
                        <input
                          type="text"
                          name="medication2Frequency"
                          value={formData.medication2Frequency}
                          onChange={handleChange}
                          placeholder="Frequency"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Do you consume alcohol or smoke?
                </label>
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
              <h2 className="font-semibold text-lg">
                Section 4: Lifestyle & Preferences
              </h2>
              <p className="text-gray-600">
                Help us understand your personal preferences and lifestyle.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${calculateProgress([
                      "preferredLanguage",
                      "dietaryPreferences",
                      "exerciseDuringPregnancy",
                      "infoSourceDuringPregnancy",
                    ])}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {calculateProgress([
                  "preferredLanguage",
                  "dietaryPreferences",
                  "exerciseDuringPregnancy",
                  "infoSourceDuringPregnancy",
                ])}
                %
              </span>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection("lifestyle")}
              >
                {sections.lifestyle ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.lifestyle && (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What is your preferred language for medical advice and
                    resources?
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
                    Do you follow any specific dietary preferences or
                    restrictions?
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
                    Do you currently exercise or engage in physical activity
                    during pregnancy?
                  </label>
                  <input
                    type="text"
                    name="exerciseDuringPregnancy"
                    value={formData.exerciseDuringPregnancy}
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
                    name="infoSourceDuringPregnancy"
                    value={formData.infoSourceDuringPregnancy}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/*Support System Section */}
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">
                Section 5: Support System
              </h2>
              <p className="text-gray-600">Your expectations and feedback.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[100px] bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${calculateProgress([
                      "platformExpectations",
                      "challengesOrConcerns",
                      "personalizedResources",
                      "additionalFeedback",
                    ])}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {calculateProgress([
                  "platformExpectations",
                  "challengesOrConcerns",
                  "personalizedResources",
                  "additionalFeedback",
                ])}
                %
              </span>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={() => toggleSection("experience")}
              >
                {sections.experience ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {sections.experience && (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    What are your expectations from the platform?
                  </label>
                  <textarea
                    name="platformExpectations"
                    value={formData.platformExpectations}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Are there any challenges or concerns you’re currently
                    facing?
                  </label>
                  <textarea
                    name="challengesOrConcerns"
                    value={formData.challengesOrConcerns}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Would you like personalized resources?
                  </label>
                  <select
                    name="personalizedResources"
                    value={formData.personalizedResources}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Any additional feedback or suggestions?
                  </label>
                  <textarea
                    name="additionalFeedback"
                    value={formData.additionalFeedback}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  ></textarea>
                </div>
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
        <ToastContainer position="top-center" autoClose={3000} />  {/* 👈 Add here */}
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

