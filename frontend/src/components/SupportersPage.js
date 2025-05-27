import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
 
const SupportersManagement = () => {
  const [supporters, setSupporters] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSupporter, setCurrentSupporter] = useState(null);
  const [newSupporter, setNewSupporter] = useState({
    permissions: [],
    first_name: '',
    last_name: '',
    referal_email: '',
    relation: ''
  });
  const [hasSupporters, setHasSupporters] = useState(true);
  const token = useMemo(() => localStorage.getItem("token"), []);
  const navigate = useNavigate();
 
  useEffect(() => {
    fetchSupporters();
  }, []);
 
  const fetchSupporters = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/supporters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupporters(response.data.referedSupporters);
      setHasSupporters(response.data.referedSupporters.length > 0);
    } catch (error) {
      console.error('Error fetching supporters:', error);
    }
  };
 
 const handleAddSupporter = async () => {
  try {
    const { referal_email, permissions, first_name, last_name, relation } = newSupporter;
 
    if (!referal_email || permissions.length === 0) {
      alert('Please fill referral email and select at least one permission');
      return;
    }
 
    const referralPayload = [{
      referal_email,
      permissions,
      role: "supporter", // You must assign role explicitly
      first_name,
      last_name,
      relation
    }];
 
    await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/users/send-referels`,
      referralPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
 
    setShowAddModal(false);
    setNewSupporter({ permissions: [], first_name: '', last_name: '', referal_email: '', relation: '' });
    fetchSupporters();
  } catch (error) {
    console.error('Error adding supporter:', error);
    alert('Failed to add supporter: ' + (error.response?.data?.error || error.message));
  }
};
 
 
  const handleEditSupporter = async () => {
    try {
      if (!currentSupporter.permissions || currentSupporter.permissions.length === 0) {
        alert('Please select at least one permission');
        return;
      }
 
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/users/supporter/${currentSupporter._id}`,
        { permissions: currentSupporter.permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      setCurrentSupporter(null);
      fetchSupporters();
    } catch (error) {
      console.error('Error updating supporter:', error);
      alert('Failed to update supporter: ' + (error.response?.data?.error || error.message));
    }
  };
 
  const handleDeleteSupporter = async (id) => {
    if (window.confirm('Are you sure you want to remove this supporter?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/users/supporter/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSupporters();
      } catch (error) {
        console.error('Error deleting supporter:', error);
        alert('Failed to delete supporter: ' + (error.response?.data?.error || error.message));
      }
    }
  };
 
  const openEditModal = (supporter) => {
    setCurrentSupporter({ ...supporter });
    setShowEditModal(true);
  };
 
 const togglePermission = (permission, isEdit = false) => {
    if (isEdit) {
      // Changed: directly use permission labels in currentSupporter.permissions
      const updatedPermissions = currentSupporter.permissions.includes(permission)
        ? currentSupporter.permissions.filter(p => p !== permission)
        : [...currentSupporter.permissions, permission];
      setCurrentSupporter({ ...currentSupporter, permissions: updatedPermissions });
    } else {
      // Changed: directly use permission labels in newSupporter.permissions
      const updatedPermissions = newSupporter.permissions.includes(permission)
        ? newSupporter.permissions.filter(p => p !== permission)
        : [...newSupporter.permissions, permission];
      setNewSupporter({ ...newSupporter, permissions: updatedPermissions });
    }
  };
 
  // Changed: permissionOptions now just uses labels (no IDs)
  const permissionOptions = [
    { label: 'View Pregnancy Map' },
    { label: 'View Mom Network' },
    { label: 'View Resources' }
  ];
 
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Supporters</h1>
        <p className="text-gray-700 mb-8">
          Choose who can join you on your journey. You control what they can
          track, and you can update access whenever you need.
        </p>
 
        <div className="mb-8">
          <p className="font-medium mb-3">
            Do you have someone supporting you through your pregnancy?
          </p>
          <div className="flex space-x-4">
            <button
              className={`px-6 py-2 rounded ${
                hasSupporters
                  ? "bg-green-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700"
              }`}
              onClick={() => setHasSupporters(true)}
            >
              YES
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded ${
                !hasSupporters
                  ? "bg-green-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700"
              }`}
              onClick={() => {
                setHasSupporters(false);
                navigate("/");
              }}
            >
              NO
            </button>
          </div>
        </div>
 
        {hasSupporters && (
          <>
            {supporters.length > 0 ? (
              supporters.map((supporter) => (
                <div
                  key={supporter._id}
                  className="bg-gray-100 rounded-lg p-4 mb-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">
                      {supporter.user_name || supporter.email} -{" "}
                      {supporter.role || "Supporter"}
                    </h3>
                    <p className="text-sm text-gray-600">{supporter.email}</p>
                  </div>
                  <button
                    onClick={() => openEditModal(supporter)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 italic mb-4">
                No supporters added yet.
              </p>
            )}
 
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center mt-4 text-gray-600 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add supporters
            </button>
          </>
        )}
      </div>
 
      {/* Add Supporter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Supporter</h2>
 
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSupporter.first_name}
                onChange={(e) =>
                  setNewSupporter({
                    ...newSupporter,
                    first_name: e.target.value,
                  })
                }
                placeholder="Enter first name"
              />
            </div>
 
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSupporter.last_name}
                onChange={(e) =>
                  setNewSupporter({
                    ...newSupporter,
                    last_name: e.target.value,
                  })
                }
                placeholder="Enter last name"
              />
            </div>
 
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSupporter.referal_email}
                onChange={(e) =>
                  setNewSupporter({
                    ...newSupporter,
                    referal_email: e.target.value,
                  })
                }
                placeholder="Enter referal email"
              />
            </div>
 
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Relation</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={newSupporter.relation}
                onChange={(e) =>
                  setNewSupporter({ ...newSupporter, relation: e.target.value })
                }
                placeholder="Enter relation"
              />
            </div>
 
            <div className="mb-4">
              <p className="font-medium mb-2">Permissions</p>
              {permissionOptions.map((option) => (
                <label
                  key={option.label}
                  className="flex items-center mb-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    // Changed: use option.label instead of option.id
                    checked={newSupporter.permissions.includes(option.label)}
                    onChange={() => togglePermission(option.label)} // Changed
                  />
                  {option.label}
                </label>
              ))}
            </div>
 
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSupporter}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Edit Supporter Modal */}
      {showEditModal && currentSupporter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Edit Supporter Permissions
            </h2>
            <p className="mb-4 font-semibold">{currentSupporter.email}</p>
 
            <div className="mb-4">
              <p className="font-medium mb-2">Permissions</p>
              {permissionOptions.map((option) => (
                <label
                  key={option.label}
                  className="flex items-center mb-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    // Changed: use option.label instead of option.id
                    checked={currentSupporter.permissions.includes(
                      option.label
                    )}
                    onChange={() => togglePermission(option.label, true)} // Changed
                  />
                  {option.label}
                </label>
              ))}
            </div>
 
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentSupporter(null);
                }}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteSupporter(currentSupporter._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Remove
                </button>
                <button
                  onClick={handleEditSupporter}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default SupportersManagement;
 
 