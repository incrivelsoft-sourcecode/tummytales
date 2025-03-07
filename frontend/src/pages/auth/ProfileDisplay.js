import { useEffect, useState } from "react";

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/mom/all/surveys`)
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data); // Log the response
        setProfile(data);
      })
      .catch((error) => console.error("Error fetching profile:", error));
  }, []);
  

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h2>Profile Details</h2>
      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
    </div>
  );
};

export default Profile;
