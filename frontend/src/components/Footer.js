import React from "react";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa"; // Import Icons

const Footer = () => {
  return (
    <footer className="bg-[#b6b774] text-[#e0e3a0] py-12 px-10 flex justify-between items-start">
      {/* Left Section */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold opacity-80">TummyTales</h2>
        <p className="font-medium text-white">
          Pregnancy in the U.S. shouldn’t mean cultural confusion!<br />
          <span className="font-bold">Let’s break it down.</span>
        </p>
        {/* Social Icons */}
        <div className="flex space-x-4 text-white text-lg">
          <FaInstagram />
          <FaFacebookF />
          <FaTwitter />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex space-x-16 text-[#e0e3a0] text-sm">
        <div className="space-y-2">
          <a href="/pregnancy-map" className="block hover:underline">Pregnancy Map</a>
          <a href="/mom-network" className="block hover:underline">Mom-to-Mom Network</a>
        </div>
        <div className="space-y-2">
          <a href="ask-amma" className="block hover:underline">Ask Amma</a>
          <a href="/" className="block hover:underline">Resources</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
