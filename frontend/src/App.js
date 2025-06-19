import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Importing Pages
import Home from "./pages/HomePage";
import SelectRole from "./pages/auth/SelectRole";
import Register from "./pages/auth/Register";
import SupporterRegister from "./pages/auth/SupporterRegister";
import SignIn from "./pages/auth/SignIn";
import ProfileSetup from "./pages/auth/ProfileSetup";
import ProfileDisplay from "./pages/auth/ProfileDisplay";
import ThreadAndChatDiscussionPage from "./pages/ThreadAndChatDiscussionPage";
import Navbar from "./components/navbar";
import ChatBox from './pages/auth/ChatBox';
import PregnancyTracker from "./pages/auth/PregnancyTracker";
import SupportersPage from "./components/SupportersPage";
import Thali from "./pages/auth/Thali";
import Footer from "./components/Footer";
import MomNetworkPage from "./pages/auth/MomNetwork";
import AskAmmaPage from "./pages/auth/AskAmma";
import DailyMealPlan from "./pages/auth/DailyMealPlan";
import EssentialTests from "./pages/auth/EssentialTests";
import BloodTest from "./pages/auth/BloodTest";
import UrineTest from "./pages/auth/UrineTest";
import DatingViability from "./pages/auth/DatingViability";
import GeneticScreening from "./pages/auth/GeneticScreening";
import NuchalTranslucency from "./pages/auth/NuchalTranslucency";
import MandatoryHealthCare from "./pages/auth/MandatoryHealthCare";
import CulturalPractices from "./pages/auth/CulturalPractices";
import OtpVerification from "./pages/auth/OtpVerification";
import Nutrition from "./pages/auth/Nutrition";
import RecipeCustomizationTest from './components/RecipeCustomizationTest';
import ErrorBoundary from './components/ErrorBoundary';

// Import your SupporterList component here
import SupporterList from "./pages/auth/SupporterList";

function App() {
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
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const location = useLocation();
  const hiddenNavbarRoutes = ["/profile-setup", "/supporters"];
  const shouldHideNavbar = hiddenNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <div className="mt-14 p-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/supporter-register" element={<SupporterRegister />} />
          <Route path="/chatbox" element={<ChatBox />} />
          <Route path="/profile-display/:id" element={<ProfileDisplay />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/pregnancy-tracker" element={<PregnancyTracker />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/supporters" element={<SupportersPage />} />
          <Route path="/supporter-list" element={<SupporterList />} />
          <Route path="/mom-supporter-network" element={<ThreadAndChatDiscussionPage />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/thali" element={<Thali />} />
          <Route path="/mom-network" element={<MomNetworkPage />} />
          <Route path="/ask-amma" element={<AskAmmaPage />} />
          <Route path="/daily-meal-plan" element={<DailyMealPlan />} />
          <Route path="/essential-tests" element={<EssentialTests />} />
          <Route path="/blood-test" element={<BloodTest />} />
          <Route path="/urine-test" element={<UrineTest />} />
          <Route path="/dating-viability" element={<DatingViability />} />
          <Route path="/genetic-screening" element={<GeneticScreening />} />
          <Route path="/nuchal-translucency" element={<NuchalTranslucency />} />
          <Route path="/mandatoryhealthcare" element={<MandatoryHealthCare />} />
          <Route path="/culturalpractices" element={<CulturalPractices />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/test-customization" element={
            <ErrorBoundary>
              <RecipeCustomizationTest />
            </ErrorBoundary>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <ToastContainer position="top-center" autoClose={5000} />
      <Footer />
    </>
  );
}

// Wrap App with Router
const RootApp = () => (
  <Router>
    <App />
  </Router>
);

export default RootApp;