import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OtpVerification = ({ onVerify, onResend }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [showTimer, setShowTimer] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setShowTimer(false);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value.slice(0, 1);
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");
    onVerify(enteredOtp);
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-[400px]">
        <h2 className="text-xl font-bold text-gray-800 mb-2">OTP verification</h2>
        <p className="text-sm text-gray-600 mb-6">
          Please enter the OTP (One-Time Password) sent to your registered email/phone number to complete your verification.
        </p>

        <div className="flex justify-between space-x-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              className="w-10 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={digit}
              onChange={(e) => handleChange(e, index)}
            />
          ))}
        </div>

        {showTimer && (
          <div className="flex justify-between text-sm text-gray-500 mb-6">
            <span>
              Remaining time: <span className="text-indigo-500">00:{timer < 10 ? `0${timer}` : timer}s</span>
            </span>
            <button
              onClick={() => {
                setTimer(30);
                setShowTimer(true);
                onResend();
              }}
              disabled={timer > 0}
              className={`ml-2 font-medium ${timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-500"}`}
            >
              Resend
            </button>
          </div>
        )}

        <button
          onClick={handleVerify}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Verify
        </button>

        <button
          onClick={handleCancel}
          className="w-full border border-indigo-600 text-indigo-600 mt-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OtpVerification;



//trying
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";

// const OtpVerification = () => {
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [timer, setTimer] = useState(30);
//   const [showTimer, setShowTimer] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchOtp = async () => {
//       try {
//         const email = localStorage.getItem("email");
//         const response = await axios.get(
//           `${process.env.REACT_APP_BACKEND_URL}/get-latest-otp`,
//           { params: { email } }
//         );
//         if (response.status === 200 && response.data.otp) {
//           const otpDigits = response.data.otp.split("");
//           setOtp(otpDigits);
//         }
//       } catch (error) {
//         console.error("Error fetching OTP:", error);
//       }
//     };

//     fetchOtp();
//   }, []);

//   useEffect(() => {
//     if (timer > 0) {
//       const countdown = setTimeout(() => setTimer(timer - 1), 1000);
//       return () => clearTimeout(countdown);
//     } else {
//       setShowTimer(false);
//     }
//   }, [timer]);

//   const handleChange = (e, index) => {
//     const value = e.target.value.slice(0, 1);
//     const updatedOtp = [...otp];
//     updatedOtp[index] = value;
//     setOtp(updatedOtp);

//     if (value && index < 5) {
//       document.getElementById(`otp-${index + 1}`).focus();
//     }
//   };

//   const handleVerify = async () => {
//     const enteredOtp = otp.join("");
//     const email = localStorage.getItem("email");

//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_BACKEND_URL}/verify-otp`,
//         {
//           email,
//           otp: enteredOtp,
//         }
//       );

//       if (response.status === 200) {
//         toast.success("OTP verified successfully!", {
//           position: "top-center",
//         });

//         // Optionally store token/user info
//         localStorage.setItem("token", response.data.token);
//         localStorage.setItem("userId", response.data.userId);
//         localStorage.setItem("status", "verified");

//         setTimeout(() => {
//           navigate("/profile-setup"); // Update destination as needed
//         }, 1000);
//       }
//     } catch (error) {
//       toast.error(
//         error.response?.data?.message || "OTP verification failed",
//         { position: "top-center" }
//       );
//     }
//   };

//   const handleResendOtp = async () => {
//     const email = localStorage.getItem("email");

//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_BACKEND_URL}/resend-otp`,
//         { email }
//       );
//       if (response.status === 200) {
//         toast.success("OTP resent successfully!", { position: "top-center" });
//         setTimer(30);
//         setShowTimer(true);
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to resend OTP", {
//         position: "top-center",
//       });
//     }
//   };

//   const handleCancel = () => {
//     navigate("/");
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <div className="bg-white shadow-md rounded-xl p-8 w-[400px]">
//         <h2 className="text-xl font-bold text-gray-800 mb-2">
//           OTP Verification
//         </h2>
//         <p className="text-sm text-gray-600 mb-6">
//           Please enter the OTP sent to your registered email to complete
//           verification.
//         </p>

//         <div className="flex justify-between space-x-2 mb-4">
//           {otp.map((digit, index) => (
//             <input
//               key={index}
//               id={`otp-${index}`}
//               type="text"
//               maxLength={1}
//               className="w-10 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={digit}
//               onChange={(e) => handleChange(e, index)}
//             />
//           ))}
//         </div>

//         {showTimer && (
//           <div className="flex justify-between text-sm text-gray-500 mb-6">
//             <span>
//               Remaining time:{" "}
//               <span className="text-indigo-500">
//                 00:{timer < 10 ? `0${timer}` : timer}s
//               </span>
//             </span>
//             <button
//               onClick={handleResendOtp}
//               disabled={timer > 0}
//               className={`ml-2 font-medium ${
//                 timer > 0
//                   ? "text-gray-400 cursor-not-allowed"
//                   : "text-indigo-500"
//               }`}
//             >
//               Resend
//             </button>
//           </div>
//         )}

//         <button
//           onClick={handleVerify}
//           className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
//         >
//           Verify
//         </button>

//         <button
//           onClick={handleCancel}
//           className="w-full border border-indigo-600 text-indigo-600 mt-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// };

// export default OtpVerification;