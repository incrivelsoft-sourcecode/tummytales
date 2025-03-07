import React from 'react';

const ThreadDiscussionPage = () => {
  return (
    <div className="flex">
      {/* Left sidebar */}
      <div className="w-64 p-4 border-r">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search Threads"
              className="w-full pl-10 pr-3 py-1 border rounded"
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Popular threads</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 border rounded text-left hover:bg-gray-100">
              Moms in San Diego
            </button>
            <button className="w-full py-2 px-4 border rounded text-left hover:bg-gray-100">
              Dr. Kritz's Patients
            </button>
            <button className="w-full py-2 px-4 border rounded text-left hover:bg-gray-100">
              Gestational Diabetes
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Chats</h2>
          <div className="space-y-2">
            <button className="w-full py-2 px-4 border rounded text-left hover:bg-gray-100">
              Ashna
            </button>
            <button className="w-full py-2 px-4 border rounded text-left hover:bg-gray-100">
              Nikita
            </button>
            <button className="w-full py-2 px-4 border rounded text-left hover:bg-gray-100">
              Radha
            </button>
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 p-4">
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-medium">Your Thoughts...</h2>
          <p className="text-sm text-gray-600">Write down any questions or concerns to start a thread.</p>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {/* Post 1 */}
          <div className="bg-purple-50 p-4 rounded">
            <div className="mb-2">
              <span className="font-medium">Ashna G.</span>
              <span className="text-gray-500 text-sm"> - 2 hours ago</span>
            </div>
            <p className="text-sm">
              Hello! I have just started my second trimester and I want to get more active. What has been everyone's experiences with prenatal yoga and is it okay to start this early? Thank you!
            </p>
            <div className="flex mt-2 space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Post 2 */}
          <div className="bg-purple-50 p-4 rounded">
            <div className="mb-2">
              <span className="font-medium">Wanda S.</span>
              <span className="text-gray-500 text-sm"> - 16 hours ago</span>
            </div>
            <p className="text-sm">
              Good morning everyone! I am 17 weeks pregnant and I have been feeling some sort of slight cramping. I don't see any spotting yet, but I am feeling slightly concerned. I sent a message to my doctor this morning, but I was wondering if anyone else has been experiencing this or whether or not this is normal?
            </p>
            <div className="flex mt-2 space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Post 3 */}
          <div className="bg-purple-50 p-4 rounded">
            <div className="mb-2">
              <span className="font-medium">Martina K.</span>
              <span className="text-gray-500 text-sm"> - 4 days ago</span>
            </div>
            <p className="text-sm">
              Hello everyone! I am a to-be mother, currently 37 weeks. I was wondering if anyone had any recommendations of a lactation specialist that they have used personally. I live in the San Diego area, around 20 minutes from downtown. Please contact me if you have any suggestions!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadDiscussionPage;