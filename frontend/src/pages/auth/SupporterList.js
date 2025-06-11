import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const SupporterList = () => {
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({});
  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    const fetchSupporters = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/referals`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data;
        let supportersArray = Array.isArray(data?.referals) ? data.referals : [];
        setSupporters(supportersArray);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          err.message ||
          "Failed to load supporters"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSupporters();
  }, [token]);

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData({ ...supporters[index] });
  };

  const handleCancel = () => {
    setEditIndex(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/users/edit-referals`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = [...supporters];
      updated[editIndex] = response.data.referal;
      setSupporters(updated);
      setEditIndex(null);
      setFormData({});
    } catch (err) {
      alert(
        err.response?.data?.error || err.message || "Failed to update supporter"
      );
    }
  };

  // New delete handler
  const handleDelete = async (referal_email) => {
    if (!window.confirm("Are you sure you want to delete this supporter?")) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/users/deletereferals`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { referal_email }, // DELETE request with body
        }
      );

      // Remove deleted supporter from the local list
      setSupporters((prev) =>
        prev.filter((s) => s.referal_email !== referal_email)
      );

      // If editing this supporter, cancel editing
      if (editIndex !== null && supporters[editIndex]?.referal_email === referal_email) {
        setEditIndex(null);
        setFormData({});
      }
    } catch (err) {
      alert(
        err.response?.data?.error || err.message || "Failed to delete supporter"
      );
    }
  };

  if (loading) return <p>Loading supporters...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!supporters.length) return <p>No supporters found. Add some supporters first.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Supporters List</h1>
      <ul className="space-y-4">
        {supporters.map((supporter, index) => (
          <li
            key={supporter._id || supporter.email}
            className="border rounded p-4 bg-gray-50"
          >
            {editIndex === index ? (
              <>
                <div className="space-y-2">
                  <input
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleChange}
                    className="border p-2 w-full"
                    placeholder="First Name"
                  />
                  <input
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                    className="border p-2 w-full"
                    placeholder="Last Name"
                  />
                  <input
                    name="relation"
                    value={formData.relation || ""}
                    onChange={handleChange}
                    className="border p-2 w-full"
                    placeholder="Relation"
                  />
                  <input
                    name="permissions"
                    value={
                      Array.isArray(formData.permissions)
                        ? formData.permissions.join(", ")
                        : formData.permissions || ""
                    }
                    // ✅ FIXED: Clean permissions array to remove empty strings
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: e.target.value
                          .split(",")
                          .map((p) => p.trim())
                          .filter((p) => p.length > 0), // <-- ADDED this to remove empty values
                      }))
                    }
                    className="border p-2 w-full"
                    placeholder="Permissions (comma separated)"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white px-4 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-400 text-white px-4 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  {supporter.first_name || supporter.user_name || "No Name"}{" "}
                  {supporter.last_name || ""}
                </p>
                <p>Email: {supporter.referal_email || supporter.email}</p>
                {supporter.relation && <p>Relation: {supporter.relation}</p>}
                {supporter.permissions && (
                  <p>
                    Permissions:{" "}
                    {Array.isArray(supporter.permissions)
                      ? supporter.permissions.join(", ")
                      : supporter.permissions}
                  </p>
                )}
                <div className="mt-2 flex gap-4">
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-blue-500 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(supporter.referal_email || supporter.email)
                    }
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SupporterList;
