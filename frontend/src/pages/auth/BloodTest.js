import React from "react";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FaBars } from "react-icons/fa";


const BloodTestInfo = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-[#FAF8E8] min-h-screen p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold text-gray-700 tracking-wide">
          <span className="text-gray-900 font-bold">Essential Testing Tales</span>
        </h1>
        <div className="flex items-center gap-4">
          <button className="text-gray-800 text-sm font-medium border-b border-gray-800 hover:border-gray-600">
            Complete & Continue
          </button>
          <FaBars className="text-gray-700 cursor-pointer" />
        </div>
      </div>

      {/* Content Section */}
      <div className="border-t border-gray-400 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Text Content */}
        <div className="pr-8">
          <h2 className="text-gray-600 uppercase text-sm font-semibold">First Trimester</h2>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-1">Blood Tests</h1>
          
          <p className="text-gray-700 mt-4 leading-relaxed">
            Getting your blood work done is one of the first steps of your pregnancy. This will give the doctor
            several details that will be used in your future. You will be asked for additional blood samples later
            as well, but this will first assess overall health and any underlying conditions you may have.
          </p>

          <h3 className="font-semibold text-gray-900 mt-6">When:</h3>
          <p className="text-gray-700">
            <a href="#" className="text-blue-600 underline">First Prenatal Visit at 8 weeks.</a> The doctor will give you a lab order and the results will be sent straight to the doctor.
          </p>

          <h3 className="font-semibold text-gray-900 mt-6">What Does the Blood Work Check:</h3>
          <ul className="text-gray-700 list-disc pl-5 mt-2 space-y-2">
            <li><strong>Blood Type & Rh Factor:</strong> Determines if Rh incompatibility exists between mother and baby.</li>
            <li><strong>Complete Blood Count (CBC):</strong> Screens for anemia, infections, and overall blood health.</li>
            <li><strong>Rubella Immunity:</strong> Checks for immunity against German measles (rubella), which can cause birth defects.</li>
            <li><strong>Hepatitis B & C Screening:</strong> Detects liver infections that could be passed to the baby.</li>
            <li><strong>HIV & Syphilis Screening:</strong> Identifies infections that could affect pregnancy and require treatment.</li>
            <li><strong>Thyroid Function Test:</strong> Ensures proper thyroid hormone levels, as imbalances can lead to pregnancy complications.</li>
          </ul>
        </div>

        {/* Right Side - Image */}
        <div className="flex justify-center md:justify-end">
          <div className="bg-[#DCCFB2] p-25 rounded-lg">
            <img
              src="/Image14.jpg"
              alt="Blood Test Info"
              className="rounded-lg shadow-lg w-full max-w-md"
            />
          </div>
        </div>
      </div>
      <div className="bg-[#B5B57A] p-6 text-[#393C1C]">
      <div className="max-w-4xl mx-auto">
        <div
          className="flex justify-between items-center border-t border-white pt-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="text-lg font-semibold">Additional Resources</h3>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {isOpen && (
          <p className="mt-2 text-sm text-[#393C1C]">
            Add a short summary or a list of helpful resources here.
          </p>
        )}
        <hr className="mt-2 border-white" />
      </div>
      <div className="mt-6 text-center text-[#393C1C]">
        <button className="relative text-sm font-semibold uppercase">
          Complete & Continue
          <span className="block w-full h-[1px] bg-[#393C1C] mt-1"></span>
        </button>
      </div>
    </div>
    </div>
  );
};

export default BloodTestInfo;