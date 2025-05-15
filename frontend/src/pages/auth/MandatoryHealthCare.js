import React from "react";
import {
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";

const MandatoryHealthCare = () => {
  const navLinks = [
    "Home",
    "Pregnancy Map",
    "Mom-to-Mom Network",
    "Ask Amma",
    "Resources",
  ];

  const essentials = [
    { title: "Sleep Essentials", img: "" },
    { title: "Diapering Essentials", img: "" },
    { title: "Feeding Essentials", img: "" },
    { title: "Bath & Skincare", img: "" },
    { title: "Clothing Essentials", img: "" },
    { title: "Travel Essentials", img: "" },
  ];

  return (
    <>
      {/* <header className="bg-[#2F3002] text-white px-8 py-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-bold text-[#F4F391]">TummyTales</h1>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-white">
            {navLinks.map((link) => (
              <a href="#" key={link} className="hover:text-[#F4F391]">{link}</a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="#" className="hover:text-[#F4F391]">Login</a>
          <button className="border border-[#F4F391] px-4 py-1 rounded-md text-[#F4F391] hover:bg-[#F4F391] hover:text-[#2F3002] transition">Sign Up</button>
        </div>
      </header> */}

      <section className="bg-[#B7B87F] text-white px-8 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            Mandatory Baby Prep Practices
          </h2>
          <p className="text-lg leading-relaxed">
            <strong className="text-white">“Baby prep, the must-do list.”</strong><br />
            Here’s everything required for prepping for your baby in the U.S.—from healthcare essentials to products you’ll need, with links to help you get started.<br />
            Curious about cultural baby prep? Head over to our dedicated page for that.
          </p>
        </div>
      </section>

      <section className="bg-[#FAF9BE] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {essentials.map((item, index) => (
            <div key={index} className="text-center">
              <img
                src={item.img}
                alt={item.title}
                className="rounded-3xl mb-4 w-full h-60 object-cover bg-gray-200"
              />
              <h2 className="text-2xl font-extrabold text-[#373500] underline decoration-[#373500] underline-offset-[0.6rem] mb-4">
                {item.title.toUpperCase()}
              </h2>
              <div className="flex justify-center gap-4">
                <button className="border border-[#373500] px-6 py-2 rounded-md text-[#373500] font-medium hover:bg-[#373500] hover:text-white transition">
                  Book now
                </button>
                <button className="border border-[#373500] px-6 py-2 rounded-md text-[#373500] font-medium hover:bg-[#373500] hover:text-white transition">
                  Add to Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
{/* 
      <footer className="bg-[#B7B87F] py-12 px-6 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-4">TummyTales</h1>
            <p className="max-w-sm text-white">
              Pregnancy in the U.S. shouldn’t mean cultural confusion! Let’s break it down.
            </p>
            <div className="flex mt-4 gap-4 text-white">
              <Instagram className="w-6 h-6" />
              <Facebook className="w-6 h-6" />
              <Twitter className="w-6 h-6" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[#F4F391] underline text-lg font-medium">
            <a href="#">Pregnancy Map</a>
            <a href="#">Ask Amma</a>
            <a href="#">Mom-to-Mom Network</a>
            <a href="#">Resources</a>
          </div>
        </div>
      </footer> */}
    </>
  );
};

export default MandatoryHealthCare;
