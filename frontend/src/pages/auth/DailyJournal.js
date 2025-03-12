import React, { useState } from "react";

const DailyJournal = () => {
  const [media, setMedia] = useState([]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setMedia([...media, ...files]);
  };

  return (
    <div className="flex flex-col items-center p-6 relative">
      {/* Back Button */}
      <button
        className="absolute top-4 left-4 px-4 py-2 bg-gray-500 text-white text-lg font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all"
        onClick={() => window.history.back()}
      >
        ⬅ Back
      </button>

      {/* Heading */}
      <h1 className="text-2xl font-bold"><u>DAILY JOURNAL</u></h1> 
      <h2 className="text-lg font-semibold mt-2">How are you feeling today?</h2>

      {/* Journal Input */}
      <textarea
        className="w-full md:w-3/4 h-40 p-4 mt-4 bg-purple-100 border rounded-lg shadow-lg"
        placeholder="Share your thoughts... write, draw, or scribble away!"
      />

      {/* Media Upload */}
      <label className="w-full md:w-3/4 mt-4 p-4 bg-purple-200 border rounded-lg shadow-lg flex items-center cursor-pointer">
        <input type="file" multiple accept="image/*, video/*, audio/*" className="hidden" onChange={handleFileChange} />
        <span className="text-gray-700">📂 Upload Media from your device</span>
      </label>

      {/* Display Uploaded Media */}
      <div className="mt-4 w-full md:w-3/4">
        {media.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((file, index) => (
              <div key={index} className="border p-2 rounded-lg shadow-md">
                {file.type.startsWith("image/") && (
                  <img src={URL.createObjectURL(file)} alt="Uploaded" className="w-full h-32 object-cover rounded" />
                )}
                {file.type.startsWith("video/") && (
                  <video controls className="w-full h-32 rounded">
                    <source src={URL.createObjectURL(file)} type={file.type} />
                    Your browser does not support the video tag.
                  </video>
                )}
                {file.type.startsWith("audio/") && (
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(file)} type={file.type} />
                    Your browser does not support the audio tag.
                  </audio>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyJournal;
