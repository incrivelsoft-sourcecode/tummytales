import React, { useState } from "react";

const SupportersPage = () => {
  const [hasSupporter, setHasSupporter] = useState(null);
  const [supporterName, setSupporterName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [shareProgress, setShareProgress] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [referralPin, setReferralPin] = useState("****************");

  const handlePermissionChange = (option) => {
    if (permissions.includes(option)) {
      setPermissions(permissions.filter((item) => item !== option));
    } else {
      setPermissions([...permissions, option]);
    }
  };

  const generateReferralPin = () => {
    const pin = Math.random().toString(36).substring(2, 10).toUpperCase();
    setReferralPin(pin);
  };

  const handleSubmit = () => {
    console.log({
      supporterName,
      relationship,
      shareProgress,
      permissions,
      referralPin,
    });
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 border border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Supporters</h1>
      <p className="text-gray-600 mb-4">
        Choose who can join you on your journey. You control what they can track, and you can update access whenever you need.
      </p>

      {/* Toggle Buttons */}
      <div className="mb-6 flex items-center space-x-4">
        <span className="text-lg font-medium">Do you have someone supporting you through your pregnancy?</span>
        <button
          className={`px-4 py-2 rounded-md ${hasSupporter === true ? "bg-green-500 text-white" : "bg-gray-200"}`}
          onClick={() => setHasSupporter(true)}
        >
          YES
        </button>
        <button
          className={`px-4 py-2 rounded-md ${hasSupporter === false ? "bg-red-500 text-white" : "bg-gray-200"}`}
          onClick={() => setHasSupporter(false)}
        >
          NO
        </button>
      </div>

      {/* Supporter Form */}
      {hasSupporter && (
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Add Primary Supporter</h2>

          <label className="block text-gray-700">Supporter's Name:</label>
          <input
            type="text"
            placeholder="Enter name"
            value={supporterName}
            onChange={(e) => setSupporterName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />

          <label className="block text-gray-700 mt-3">Relationship:</label>
          <input
            type="text"
            placeholder="Husband, Friend, etc."
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />

          {/* Share Pregnancy Progress */}
          <p className="mt-4 font-semibold">Would you like to share your pregnancy progress with your supporter?</p>
          <div className="mt-2 flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="progress"
                value="Yes"
                checked={shareProgress === "Yes"}
                onChange={() => setShareProgress("Yes")}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="progress"
                value="No"
                checked={shareProgress === "No"}
                onChange={() => setShareProgress("No")}
                className="mr-2"
              />
              No
            </label>
          </div>

          {/* Permissions */}
          <p className="mt-4 font-semibold">Which pages would you like to grant permission for your supporter to track?</p>
          <p className="text-gray-600 text-sm mb-2">Select the pages you'd like them to access.</p>
          <div className="space-y-2">
            {["Pregnancy tracker", "Daily Journal", "Appointments", "Baby name"].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.includes(option)}
                  onChange={() => handlePermissionChange(option)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>

          {/* Referral PIN */}
          <p className="mt-4 font-semibold">Generate a Referral Pin for your supporter</p>
          <p className="text-gray-600 text-sm mb-2">
            Once generated, share the referral pin with your supporter. They can access only the pages you allow.
          </p>
          <input
            type="text"
            value={referralPin}
            readOnly
            className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-center"
          />
          <button
            onClick={generateReferralPin}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate PIN
          </button>

          {/* Add Supporter Button */}
          <button
            onClick={handleSubmit}
            className="mt-4 w-2/5 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
          >
            ADD
          </button>
        </div>
      )}
    </div>
  );
};

export default SupportersPage;
