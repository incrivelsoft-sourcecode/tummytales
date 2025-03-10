import React from "react";
import { useNavigate } from "react-router-dom";


const Pregnancy = () => {
  const navigate=useNavigate();
  return (
    <div className="flex justify-center items-center mt-5 bg-purple-100 p-5 rounded-lg">
      <div className="flex w-5/6 p-5 rounded-lg bg-purple-50 shadow-lg">
        <div className="flex-1 text-center">
          <h2 className="font-bold text-lg">CATALOG</h2>
          <button
            className="block w-4/5 mx-auto my-2 py-2 text-sm bg-purple-500 text-white rounded-lg transition hover:bg-purple-700"
            onClick={() => navigate("/first-trimester")}

          >
            1st Trimester
          </button>
          <button className="block w-4/5 mx-auto my-2 py-2 text-sm bg-purple-500 text-white rounded-lg transition hover:bg-purple-700"
          onClick={() => navigate("/second-trimester")}
          
          >
            2nd Trimester
          </button>
          <button className="block w-4/5 mx-auto my-2 py-2 text-sm bg-purple-500 text-white rounded-lg transition hover:bg-purple-700"
          onClick={() => navigate("/third-trimester")}>
            3rd Trimester
          </button>
        </div>
        <div className="flex-1 text-center ">
          <h2 className="font-bold text-lg">FEATURES</h2>
          <p className="text-base cursor-pointer underline hover:no-underline"
          onClick={() => navigate("/pregnancy-tracker")}>
            Pregnancy Tracker</p>
          <p className="text-base cursor-pointer underline hover:no-underline"
          onClick={() => navigate("/daily-journal")}>
            Daily Journal</p>
          <p className="text-base cursor-pointer underline hover:no-underline">MOM Network</p>
          <p className="text-base cursor-pointer underline hover:no-underline">Ask AI</p>
        </div>
      </div>
    </div>
  );
};

export default Pregnancy;
