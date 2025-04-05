import React, { useState, useRef } from "react";

const ThreadForm = ({ onCreateThread }) => {
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mimetype, setMimetype] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    onCreateThread(
      newThreadTitle, 
      newThreadContent, 
      selectedFile?.base64, 
      mimetype
    );

    // Reset form
    setNewThreadTitle("");
    setNewThreadContent("");
    setSelectedFile(null);
    setMimetype("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0]; // Get first file
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = () => {
        setSelectedFile({ name: file.name, base64: reader.result.split(",")[1] });
        setMimetype(file.type);
      };

      reader.onerror = (error) => {
        console.error("File conversion error:", error);
      };
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Create a New Thread</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Thread Title"
          className="w-full p-3 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={newThreadTitle}
          onChange={(e) => setNewThreadTitle(e.target.value)}
        />

        <textarea
          placeholder="Detailed description of your thread..."
          className="w-full p-3 border border-gray-300 rounded mb-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={newThreadContent}
          onChange={(e) => setNewThreadContent(e.target.value)}
        ></textarea>

        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex items-center">
            <input
              type="file"
              id="fileAttachment"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <label
              htmlFor="fileAttachment"
              className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                  clipRule="evenodd"
                />
              </svg>
              Attach File
            </label>
            {selectedFile && (
              <span className="ml-2 text-sm text-gray-600">{selectedFile.name}</span>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Post Thread
          </button>
        </div>
      </form>
    </div>
  );
};

export default ThreadForm;