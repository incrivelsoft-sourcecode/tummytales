import React, { useState, useRef, useEffect } from "react";
import PregnancyMap from "./auth/PregnancyMap";
import ChatBox from "./auth/ChatBox";

const Home = ({ setActiveTab }) => {
  const [showPregnancyContent, setShowPregnancyContent] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const pregnancyRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pregnancyRef.current && !pregnancyRef.current.contains(event.target)) {
        setShowPregnancyContent(false);
        setShowChatBox(false);
        setActiveTab("");
      }
    };

    if (showPregnancyContent || showChatBox) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPregnancyContent, showChatBox, setActiveTab]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 text-center px-6 sm:px-12 md:px-20 lg:px-32 py-10">
      {/* Main Container */}
      <div className="flex-1 w-full max-w-screen-xl mx-auto py-8">
        <div className="w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12">
          {/* Welcome Section */}
          {!showPregnancyContent && !showChatBox && (
            <div className="w-full space-y-6">
              {/* First Row */}
              <div className="w-full flex flex-wrap items-center justify-center gap-6 bg-pink-100 p-6 rounded-2xl">
                <div className="flex-1 min-h-[250px] p-10 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center bg-pink-200">
                  <h1 className="text-4xl font-extrabold text-gray-900">
                    Welcome to <span className="text-red-500">TummyTales</span>
                  </h1>
                  <p className="text-lg text-gray-700 font-medium mt-2">
                    Your pregnancy journey starts here
                  </p>
                </div>
                <div className="flex-1 min-h-[250px] p-10 rounded-2xl shadow-lg flex flex-col justify-center text-center bg-pink-200">
                  <p className="text-gray-800 text-lg">
                    Pregnancy is a beautiful journey that should be cherished. For South Asians in the United States, medical care and cultural practices often feel poles apart – we bridge that gap for you. By blending South Asian heritage with Western medicine, we will create a seamless and supportive experience. We offer guidance that blends both worlds, ensuring that no sort of dialogue gets lost. You can expect a touch of familiarity within each step of your special chapter. All you have to do is focus on growing your family.
                  </p>
                </div>
              </div>

              {/* Second Row */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 bg-green-100 p-6 rounded-2xl">
                <div className="p-6 rounded-lg shadow-md text-gray-700 text-sm sm:text-base bg-green-200">
                  "Back home, we rely on traditional remedies for morning sickness, but my doctor dismissed them and only suggested medications. I didn’t know what I could trust."
                </div>
                <div className="p-6 rounded-lg shadow-md text-gray-700 text-sm sm:text-base bg-green-200">
                  "I tried to talk to my doctor about feeling overwhelmed, but postpartum depression isn’t something I can go to my family for. I don’t know where to turn for help."
                </div>
                <div className="p-6 rounded-lg shadow-md text-gray-700 text-sm sm:text-base bg-green-200">
                  "My doctor told me to eat more protein and dairy, but I am vegetarian and they do not seem to understand my dilemma – my doctor in India didn’t mention any problems when I was there."
                </div>
              </div>

              {/* Third Row */}
              <div className="p-8 bg-blue-100 rounded-lg shadow-md text-center">
                <p className="text-gray-800 text-lg bg-blue-200 p-6 rounded-lg">
                  Moving to a new country itself presents countless challenges, yet the unique experiences of pregnant women navigating this transition often go unnoticed. Being far from the familiarity of home, family, and traditional support systems can make an already transformative journey even more overwhelming. Pregnancy is a time when advice—solicited or not—flows from every direction. However, when that advice is conflicting, shaped by both cultural traditions and unfamiliar medical practices, it can leave one feeling confused, isolated, and uncertain about the right path to take. Growing up in a different cultural environment means embracing a distinct set of norms, and adjusting to a new healthcare system and way of life takes time. TummyTales was born from our own experiences of seeking guidance and support while finding our footing in a new country. We understand the importance of feeling heard and having a space to ask questions without fear or hesitation. Through this platform, we hope to empower South Asian women with culturally relevant resources, a supportive network, and the reassurance that they are not alone in their journey.
                </p>
              </div>

              {/* Fourth Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 bg-purple-100 p-6 rounded-2xl">
                {[1, 2, 3, 4].map((item) => (
                  <div 
                    key={item} 
                    className="h-32 sm:h-40 md:h-48 rounded-lg shadow-md w-full bg-purple-200"
                  ></div>
                ))}
              </div>

              {/* Fifth Row */}
              <div className="p-6 bg-yellow-100 rounded-lg shadow-md text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 bg-yellow-200 p-4 rounded-lg">
                  Partnerships
                </h2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
