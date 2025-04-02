import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Importing Pages
import Home from "./pages/HomePage";
import SelectRole from "./pages/auth/SelectRole";
import Register from "./pages/auth/Register";
import SupporterRegister from "./pages/auth/SupporterRegister";
import SignIn from "./pages/auth/SignIn";
import PregnancyMap from "./pages/auth/PregnancyMap";
import FirstTrimester from "./pages/auth/FirstTrimester";
import SecondTrimester from "./pages/auth/SecondTrimester";
import ThirdTrimester from "./pages/auth/ThirdTrimester";
import ProfileSetup from "./pages/auth/ProfileSetup";
import ProfileDisplay from "./pages/auth/ProfileDisplay";
import ThreadAndChatDiscussionPage from "./pages/ThreadAndChatDiscussionPage";
import Navbar from "../src/components/navbar"
import ChatBox from '../src/pages/auth/ChatBox';
import PregnancyTracker from "../src/pages/auth/PregnancyTracker";
import DailyJournal from "../src/pages/auth/DailyJournal";
import SupportersPage from "../src/pages/auth/SupporterRegister";
import AskAI from "./pages/auth/AskAI";
import Thali from "./pages/auth/Thali";
import Footer from "../src/components/Footer";
import MomNetworkPage from "./pages/auth/MomNetwork";
import AskAmmaPage from "./pages/auth/AskAmma";
import DailyMealPlan from "./pages/auth/DailyMealPlan";
import EssentialTests from "./pages/auth/EssentialTests";
import BloodTest from "./pages/auth/BloodTest";
import UrineTest from "./pages/auth/UrineTest";
import DatingViability from "./pages/auth/DatingViability";
import GeneticScreening from "./pages/auth/GeneticScreening";
import NuchalTranslucency from "./pages/auth/NuchalTranslucency";

function App() {
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userName = urlParams.get("userName");
    const userId = urlParams.get("userId");
    const role = urlParams.get("role");

    if (token && userName) {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      localStorage.setItem("role", role);
      window.history.replaceState({}, document.title, "/"); // Removes query params without reload
    }
  }, []);

  return (
    <Router>
      {/* Global Navbar */}
      <Navbar />

      {/* Page Routes */}
      <div className="mt-20 p-4"> {/* Prevents content from being hidden behind Navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/supporter-register" element={<SupporterRegister />} />
          <Route path="/first-trimester" element={<FirstTrimester />} />
          <Route path="/second-trimester" element={<SecondTrimester />} />
          <Route path="/chatbox" element={<ChatBox />} /> {/* ✅ Corrected */}
          <Route path="/third-trimester" element={<ThirdTrimester />} />
          <Route path="/profile-display" element={<ProfileDisplay />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/pregnancy-map" element={<PregnancyMap />} />
          <Route path="/pregnancy-tracker" element={<PregnancyTracker />} />
          <Route path="/daily-journal" element={<DailyJournal />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />}></Route>
          <Route path="/supporters" element={<SupportersPage />} />
          <Route path="/mom-supporter-network" element={<ThreadAndChatDiscussionPage />} />
          <Route path="/ask-ai" element={<AskAI />} />  {/* ✅ Add AI Chat Page */}
          <Route path="/thali" element={<Thali/>}/>
          <Route path="/mom-network" element={<MomNetworkPage/>}/>
          <Route path="/ask-amma" element={<AskAmmaPage/>}/>
          <Route path="/daily-meal-plan" element={<DailyMealPlan/>}/>
          <Route path="/essential-tests" element={<EssentialTests/>}/>
          <Route path="/blood-test" element={<BloodTest/>}/>
          <Route path="/urine-test" element={<UrineTest/>}/>
          <Route path="/dating-viability" element={<DatingViability/>}/>
          <Route path="/genetic-screening" element={<GeneticScreening/>}/>
          <Route path="/nuchal-translucency" element={<NuchalTranslucency/>}/>

          {/* Handle unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
      <Footer/>
    </Router>
  );
}

export default App;
