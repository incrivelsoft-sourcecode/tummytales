import { useEffect, useState } from "react";

const ProfileDisplay = () => {
  const [profile, setProfile] = useState(null);
  const [editableProfile, setEditableProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
          <h2 className="text-xl font-semibold text-gray-800">Section 1: General Details</h2>
          <p className="text-gray-500 mt-1 mb-4">Let's start with some basic information to get to know you better.</p>
          
          <div className="space-y-2">
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
        </section>

        {/* Repeat similar structure for other sections */}
        {/* Section 2: Pregnancy Status */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Section 2: Pregnancy Status</h2>
          <p className="text-gray-500 mt-1 mb-4">Information about your pregnancy journey.</p>
          
          <div className="space-y-2">
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
        </section>

        {/* Section 3: Health & Healthcare */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Section 3: Health & Healthcare</h2>
          <p className="text-gray-500 mt-1 mb-4">Your healthcare information and experiences.</p>
          
          <div className="space-y-2">
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
        </section>

        {/* Section 4: Lifestyle & Preferences */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Section 4: Lifestyle & Preferences</h2>
          <p className="text-gray-500 mt-1 mb-4">Your personal preferences and lifestyle.</p>
          
          <div className="space-y-2">
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
        </section>

        {/* Section 5: Support System */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Section 5: Support System</h2>
          <p className="text-gray-500 mt-1 mb-4">Your expectations and support needs.</p>
          
          <div className="space-y-2">
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

 
// import { useEffect, useState } from "react";

// const Profile = () => {
//   const [profile, setProfile] = useState(null);

//   useEffect(() => {
//     fetch(`${process.env.REACT_APP_BACKEND_URL}/mom/all/surveys`)
//       .then((response) => response.json())
//       .then((data) => {
//         console.log("API Response:", data); // Log the response
//         setProfile(data);
//       })
//       .catch((error) => console.error("Error fetching profile:", error));
//   }, []);
  

//   if (!profile) return <p>Loading...</p>;

//   return (
//     <div>
//       <h2>Profile Details</h2>
//       <p><strong>Name:</strong> {profile.name}</p>
//       <p><strong>Email:</strong> {profile.email}</p>
//     </div>
//   );
// };

// export default Profile;
