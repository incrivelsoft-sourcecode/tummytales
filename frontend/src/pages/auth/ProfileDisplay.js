import { useEffect, useState } from "react";

const ProfileDisplay = () => {
  const [profile, setProfile] = useState(null);
  const [editableProfile, setEditableProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    pregnancy: true,
    health: true,
    lifestyle: true,
    support: true
  });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/mom/all/surveys`)
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data);
        setProfile(data);
        setEditableProfile(data);
      })
      .catch((error) => console.error("Error fetching profile:", error));
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDoubleClick = (fieldName) => {
    setIsEditing(true);
    setEditingField(fieldName);
  };

  const handleChange = (e, fieldName) => {
    setEditableProfile({
      ...editableProfile,
      [fieldName]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/mom/survey`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableProfile)
      });

      if (response.ok) {
        setProfile(editableProfile);
        setIsEditing(false);
        setEditingField(null);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Calculate completion percentages for each section
  const calculateCompletion = (sectionFields) => {
    if (!editableProfile) return 0;
    
    const filledFields = sectionFields.filter(field => {
      const value = editableProfile[field];
      return value !== null && value !== undefined && value !== '' && value !== false;
    }).length;
    
    return Math.round((filledFields / sectionFields.length) * 100);
  };

  const generalFields = ['full_name', 'age', 'gender', 'nationality', 'generation'];
  const pregnancyFields = ['currentlyPregnant', 'pregnancyWeeks', 'estimatedDueDate', 'firstPregnancy'];
  const healthFields = ['hasProvider', 'prenatalServices', 'healthcareSystem', 'navigationExperience', 'culturalChallenges'];
  const lifestyleFields = ['preferredLanguage', 'dietaryPreferences', 'physicalActivity', 'primaryInfoSource'];
  const supportFields = ['expectations', 'challenges', 'wantsPersonalizedResources', 'additionalComments'];

  const generalCompletion = calculateCompletion(generalFields);
  const pregnancyCompletion = calculateCompletion(pregnancyFields);
  const healthCompletion = calculateCompletion(healthFields);
  const lifestyleCompletion = calculateCompletion(lifestyleFields);
  const supportCompletion = calculateCompletion(supportFields);

  if (!profile) return <p className="text-center text-gray-600">Loading...</p>;

  const renderField = (fieldName, value, label) => {
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
      <div 
        onDoubleClick={() => handleDoubleClick(fieldName)}
        className="cursor-pointer"
      >
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
      <div className="flex items-center">
        <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-4">
          <div 
            className="bg-purple-600 h-2.5 rounded-full" 
            style={{ width: `${completion}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700">{completion}% complete</span>
        <svg 
          className={`w-5 h-5 ml-4 text-gray-500 transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800">PROFILE - {profile.full_name}</h1>
        <p className="text-gray-600 mt-2">
          Complete this profile to help us curate the best experience for you. Don't worry—feel free to return and update it anytime. Keeping it up to date will ensure you get the most relevant and personalized support throughout your journey.
        </p>

        <div className="border-t border-gray-200 my-6"></div>

        {/* Section 1: General Details */}
        <section className="mt-6">
          {renderSectionHeader(
            "Section 1: General Details", 
            "Let's start with some basic information to get to know you better.",
            generalCompletion,
            "general"
          )}
          
          {expandedSections.general && (
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-1">
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Full Name</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('full_name', editableProfile?.full_name)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Age</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('age', editableProfile?.age)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Gender</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('gender', editableProfile?.gender)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Nationality</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('nationality', editableProfile?.nationality)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Generation</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('generation', editableProfile?.generation)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Pregnancy Status */}
        <section className="mt-6">
          {renderSectionHeader(
            "Section 2: Pregnancy Status", 
            "Information about your pregnancy journey.",
            pregnancyCompletion,
            "pregnancy"
          )}
          
          {expandedSections.pregnancy && (
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-1">
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Currently Pregnant</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('currentlyPregnant', editableProfile?.currentlyPregnant ? "Yes" : "No")}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pregnancy Weeks</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('pregnancyWeeks', editableProfile?.pregnancyWeeks)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Estimated Due Date</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('estimatedDueDate', editableProfile?.estimatedDueDate)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">First Pregnancy</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('firstPregnancy', editableProfile?.firstPregnancy ? "Yes" : "No")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Health & Healthcare */}
        <section className="mt-6">
          {renderSectionHeader(
            "Section 3: Health & Healthcare", 
            "Your healthcare information and experiences.",
            healthCompletion,
            "health"
          )}
          
          {expandedSections.health && (
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-1">
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Has Healthcare Provider</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('hasProvider', editableProfile?.hasProvider ? "Yes" : "No")}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Prenatal Services</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('prenatalServices', editableProfile?.prenatalServices)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Healthcare System</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('healthcareSystem', editableProfile?.healthcareSystem)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Navigation Experience</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('navigationExperience', editableProfile?.navigationExperience)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cultural Challenges</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('culturalChallenges', editableProfile?.culturalChallenges)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Lifestyle & Preferences */}
        <section className="mt-6">
          {renderSectionHeader(
            "Section 4: Lifestyle & Preferences", 
            "Your personal preferences and lifestyle.",
            lifestyleCompletion,
            "lifestyle"
          )}
          
          {expandedSections.lifestyle && (
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-1">
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Preferred Language</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('preferredLanguage', editableProfile?.preferredLanguage)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Dietary Preferences</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('dietaryPreferences', editableProfile?.dietaryPreferences)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Physical Activity</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('physicalActivity', editableProfile?.physicalActivity)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Primary Info Source</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('primaryInfoSource', editableProfile?.primaryInfoSource)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 5: Support System */}
        <section className="mt-6">
          {renderSectionHeader(
            "Section 5: Your Experience and Expectations", 
            "We'd like to hear about your expectations and any concerns you may have.",
            supportCompletion,
            "support"
          )}
          
          {expandedSections.support && (
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-1">
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Expectations</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('expectations', editableProfile?.expectations)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Challenges</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('challenges', editableProfile?.challenges)}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Wants Personalized Resources</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('wantsPersonalizedResources', editableProfile?.wantsPersonalizedResources ? "Yes" : "No")}
                    </p>
                  </div>
                </div>
                
                <div className="py-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Additional Comments</h3>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-900">
                      {renderField('additionalComments', editableProfile?.additionalComments)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Save Button - Only shown when editing */}
        {isEditing && (
          <div className="mt-8 text-center">
            <button 
              onClick={handleSave}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDisplay;