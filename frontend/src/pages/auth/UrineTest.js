import React from "react";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FaBars } from "react-icons/fa";


const UrineTestsInfo = () => {
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
          <h1 className="text-4xl font-extrabold text-gray-900 mt-1">Urine Tests</h1>
          
          <p className="text-gray-700 mt-4 leading-relaxed">
          Urine tests will be a routine part of your prenatal care. While they may feel tedious, they provide valuable insights into how your body is responding to pregnancy. During your first visit, urine tests help confirm pregnancy by measuring rising HCG levels. They also screen for urinary tract infections (UTIs), kidney issues, and early signs of preeclampsia. Be prepared to receive a urine cup at every doctor’s visit, as these tests play a crucial role in monitoring your health throughout pregnancy.
          </p>

          <h3 className="font-semibold text-gray-900 mt-6">When:</h3>
          <p className="text-gray-700">
          First prenatal visit and every doctor’s appointment during pregnancy
          </p>

          <h3 className="font-semibold text-gray-900 mt-6">What the Urine Test Checks:</h3>
          <ul className="text-gray-700 list-disc pl-5 mt-2 space-y-2">
            <li><strong>HCG Levels:</strong> Human chorionic gonadotropin is a hormone produced by the placenta to confirm pregnancy. At 6-8 weeks, your levels should be around 152-32,177 mIU/mL</li>
            <li><strong>Protein Levels: </strong> High protein may indicate preeclampsia.</li>
            <li><strong>Glucose Levels: </strong> High glucose could be an early sign of gestational diabetes. </li>
            <li><strong>Bacteria: </strong> Indicates UTIs, which need treatment to prevent complications.</li>
          </ul>
        </div>

        {/* Right Side - Image */}
        <div className="flex justify-center md:justify-end">
          <div className="bg-[#DCCFB2] p-25 rounded-lg">
            <img
              src="/Image15.jpeg"
              alt="Urine Tests Info"
              className="rounded-lg shadow-lg w-full max-w-md"
            />
          </div>
        </div>
      </div>
      <br></br>
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

export default UrineTestsInfo;