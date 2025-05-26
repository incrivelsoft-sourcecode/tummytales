import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const SupporterList = () => {
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    const fetchSupporters = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/referals`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Assuming response.data is an array of supporters
        setSupporters(response.data || []);
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

  if (loading) return <p>Loading supporters...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  if (supporters.length === 0)
    return <p>No supporters found. Add some supporters first.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Supporters List</h1>
      <ul className="space-y-4">
        {supporters.map((supporter) => (
          <li
            key={supporter._id || supporter.email}
            className="border rounded p-4 bg-gray-50"
          >
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SupporterList;
