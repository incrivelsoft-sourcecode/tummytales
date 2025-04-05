import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const ProfileDisplay = () => {
  const { id: profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editableProfile, setEditableProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    pregnancy: true,
    health: true,
    lifestyle: true,
    support: true,
  });

  const user_name = localStorage.getItem("userName") || "";

  useEffect(() => {
    if (profileId) {
      fetchProfile(profileId);
    } else {
      toast.error("No profile ID found. Please create a profile first.");
      navigate("/profile-setup");
    }
  }, [profileId]);

  const fetchProfile = async (id) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/mom/survey/${id}?user_name=${user_name}`
      );

      if (res.status === 200) {
        const profileData = res.data.survey;
        if (!profileData) {
          toast.error("No profile data found.");
          return;
        }

        const formattedProfile = {
          ...profileData.generalDetails,
          ...profileData.pregnancyStatus,
          ...profileData.healthCare,
          ...profileData.lifestylePreferences,
          ...profileData.experienceAndExpectations,
        };

        setProfile(formattedProfile);
        setEditableProfile(formattedProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data.");
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDoubleClick = (fieldName) => {
    setIsEditing(true);
    setEditingField(fieldName);
  };

  const handleChange = (e, fieldName) => {
    setEditableProfile({
      ...editableProfile,
      [fieldName]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      const updatedProfile = {
        generalDetails: {
          full_name: editableProfile.full_name,
          age: editableProfile.age,
          gender: editableProfile.gender,
          nationality: editableProfile.nationality,
          generation: editableProfile.generation,
        },
        pregnancyStatus: {
          currentlyPregnant: editableProfile.currentlyPregnant,
          firstPregnancy: editableProfile.firstPregnancy,
          pregnancyWeeks: editableProfile.pregnancyWeeks,
          estimatedDueDate: editableProfile.estimatedDueDate,
        },
        healthCare: {
          hasProvider: editableProfile.hasProvider,
          prenatalServices: editableProfile.prenatalServices,
          healthcareSystem: editableProfile.healthcareSystem,
          navigationExperience: editableProfile.navigationExperience,
          culturalChallenges: editableProfile.culturalChallenges,
        },
        lifestylePreferences: {
          preferredLanguage: editableProfile.preferredLanguage,
          dietaryPreferences: editableProfile.dietaryPreferences,
          physicalActivity: editableProfile.physicalActivity,
          primaryInfoSource: editableProfile.primaryInfoSource,
          wantsPersonalizedResources: editableProfile.wantsPersonalizedResources,
        },
        experienceAndExpectations: {
          expectations: editableProfile.expectations,
          challenges: editableProfile.challenges,
          additionalComments: editableProfile.additionalComments,
        },
      };
 
      const res = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/mom/update/${profileId}`,
        {
          user_name,
          ...updatedProfile,
        }
      );
 
      if (res.status === 200) {
        setProfile(editableProfile);
        setIsEditing(false);
        setEditingField(null);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    }
  };
 

  const fields = {
    general: ["full_name", "age", "gender", "nationality", "generation"],
    pregnancy: ["currentlyPregnant", "pregnancyWeeks", "estimatedDueDate", "firstPregnancy"],
    health: ["hasProvider", "prenatalServices", "healthcareSystem", "navigationExperience", "culturalChallenges"],
    lifestyle: ["preferredLanguage", "dietaryPreferences", "physicalActivity", "primaryInfoSource"],
    support: ["expectations", "challenges", "wantsPersonalizedResources", "additionalComments"],
  };

  const calculateCompletion = (sectionFields) => {
    if (!editableProfile) return 0;

    const filledFields = sectionFields.filter((field) => {
      const value = editableProfile[field];
      return value !== null && value !== undefined && value !== "" && value !== false;
    }).length;

    return Math.round((filledFields / sectionFields.length) * 100);
  };

  const completions = {
    pregnancy: calculateCompletion(fields.pregnancy),
    health: calculateCompletion(fields.health),
    lifestyle: calculateCompletion(fields.lifestyle),
    support: calculateCompletion(fields.support),
  };

  if (!profile) return <p className="text-center text-gray-600">Loading...</p>;

  const renderField = (fieldName, value) => {
    if (isEditing && editingField === fieldName) {
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(e, fieldName)}
          onBlur={() => setEditingField(null)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      );
    }
    return (
      <div onDoubleClick={() => handleDoubleClick(fieldName)} className="cursor-pointer">
        {value || "Not provided"}
      </div>
    );
  };

  const renderSectionHeader = (title, subtitle, completion, sectionKey) => (
    <div
      className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg"
      onClick={() => toggleSection(sectionKey)}
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-1">{subtitle}</p>
      </div>
      {sectionKey !== "general" && (
        <div className="flex items-center">
          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-4">
            <div
              className="bg-purple-600 h-2.5 rounded-full"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">{completion}% complete</span>
        </div>
      )}
      <svg
        className={`w-5 h-5 ml-4 text-gray-500 transition-transform ${
          expandedSections[sectionKey] ? "rotate-180" : ""
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800">PROFILE - {profile.full_name}</h1>

        {Object.keys(fields).map((sectionKey) => (
          <section key={sectionKey} className="mt-6">
            {renderSectionHeader(
              `Section: ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`,
              "Expand to edit your details.",
              completions[sectionKey],
              sectionKey
            )}
            {expandedSections[sectionKey] && (
              <div className="space-y-2 mt-4">
                <div className="grid grid-cols-1">
                  {fields[sectionKey].map((field) => (
                    <div key={field} className="py-2">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {field.replace(/([A-Z])/g, " $1")}
                      </h3>
                      <div className="mt-1 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-900">
                          {renderField(field, editableProfile?.[field])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;

