import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AskAmmaPage = () => {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);

  // Medical Info
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [culture, setCulture] = useState("");
  const [location, setLocation] = useState("");

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const updatedChatLog = [...chatLog, { role: "user", content: message }];
    setChatLog(updatedChatLog);

    try {
      const res = await axios.post(`${process.env.REACT_APP_ASK_AMMA_URL}/api/amma/ask`, {
        age,
        weight,
        height_ft: heightFt,
        height_in: heightIn,
        gestational_age: "",
        symptoms,
        allergies,
        medications,
        blood_test: "",
        urine_test: "",
        diabetes_test: "",
        culture,
        location,
        question: message,
        chat_history: updatedChatLog,
      });

      const aiResponse = res.data.response;

      setChatLog(prev => [
        ...prev,
        { role: "ai", content: aiResponse }
      ]);

      setMessage("");
      toast.success("Dr. Amma responded!");
    } catch (error) {
      console.error("Failed to contact backend:", error);
      toast.error("AI failed to respond.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-6 grid grid-cols-12 gap-4">
      {/* Chat Area */}
      <main className="col-span-9 bg-white p-6 rounded-lg shadow h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ask Amma</h2>
        <p className="text-gray-600 mb-4">Ask a question and receive a personalized AI response.</p>
        <div className="flex-1 overflow-y-auto mb-4">
          {chatLog.length === 0 ? (
            <p className="text-gray-400">Start your conversation...</p>
          ) : (
            chatLog.map((msg, idx) => (
              <div key={idx} className="mb-4 flex items-start gap-3">
                {msg.role === "ai" && (
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3870/3870822.png"
                    alt="Doctor Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className={`text-sm font-semibold mb-1 ${msg.role === "user" ? "text-purple-600" : "text-indigo-700"}`}>{msg.role === "user" ? "You" : "Dr. Amma"}</p>
                  <div className={`px-4 py-2 rounded-lg max-w-xl ${msg.role === "user" ? "bg-indigo-100 text-gray-800" : "bg-gray-200 text-gray-900"}`}>{msg.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto">
          <div className="flex">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-grow p-3 border rounded-l-lg focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={handleSendMessage} className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700" disabled={loading}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>
      </main>

      {/* Medical Info */}
      <aside className="col-span-3 bg-white p-4 rounded-lg shadow h-[80vh] overflow-y-auto">
        <button
          className="w-full mb-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          onClick={() => setShowMedicalInfo(!showMedicalInfo)}
        >
          {showMedicalInfo ? "Hide Additional Info" : "Add Additional Info"}
        </button>

        {showMedicalInfo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input type="number" className="w-full p-2 border rounded mb-4" value={age} onChange={(e) => setAge(e.target.value)} />

            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lb)</label>
            <input type="number" className="w-full p-2 border rounded mb-4" value={weight} onChange={(e) => setWeight(e.target.value)} />

            <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
            <div className="flex space-x-2 mb-4">
              <input type="number" placeholder="ft" className="w-1/2 p-2 border rounded" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} />
              <input type="number" placeholder="in" className="w-1/2 p-2 border rounded" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
            <textarea className="w-full p-2 border rounded mb-4" rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)}></textarea>

            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input type="text" className="w-full p-2 border rounded mb-4" value={allergies} onChange={(e) => setAllergies(e.target.value)} />

            <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
            <input type="text" className="w-full p-2 border rounded mb-4" value={medications} onChange={(e) => setMedications(e.target.value)} />

            <label className="block text-sm font-medium text-gray-700 mb-1">Culture</label>
            <input type="text" className="w-full p-2 border rounded mb-4" value={culture} onChange={(e) => setCulture(e.target.value)} />

            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" className="w-full p-2 border rounded mb-4" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        )}
      </aside>
    </div>
  );
};

export default AskAmmaPage;