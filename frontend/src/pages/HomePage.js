import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("HomePage mounted");
  }, [navigate]);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="h-screen w-full flex flex-col justify-center items-start px-16 bg-cover bg-center relative overflow-hidden">
        {/* Background Image */}
        <img
          src="\Everest-Singalila-Trek.jpg"
          alt="Everest Singalila Trek"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        {/* Welcome Text */}
        <div className="relative z-10 text-left text-white max-w-[50%] pl-10">
          <h1
            className="text-6xl font-extrabold mb-4 leading-tight text-white drop-shadow-[2px_2px_4px_rgba(0,0,0,0.6)]"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Welcome to <br />
            <span className="text-[#D4D700]">TummyTales</span>
          </h1>
          <p
            className="text-2xl italic font-semibold drop-shadow-md"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Your Pregnancy Journey Starts Here
          </p>
        </div>

        {/* Information Box */}
        <div className="absolute right-20 top-1/3 bg-[#f7f7c2] text-black p-6 w-[35%] shadow-lg text-lg">
          <p style={{ fontFamily: "'Roboto', sans-serif" }}>
            Pregnancy is a beautiful journey that should be cherished. For South
            Asians in the United States, medical care and cultural practices often feel poles apart – we bridge that gap for you. By blending South Asian heritage with Western medicine, we create a seamless and supportive experience.
          </p>
          <p className="mt-4" style={{ fontFamily: "'Roboto', sans-serif" }}>
            We offer guidance that blends both worlds, ensuring that no sort of dialogue gets lost. You can expect a touch of familiarity within each step of your special chapter. All you have to do is focus on growing your family.
          </p>
        </div>

        {/* Curved Bottom Effect */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path
              fill="#f7f7c2"
              d="M0,288L80,266.7C160,245,320,203,480,208C640,213,800,267,960,282.7C1120,299,1280,277,1360,266.7L1440,256V320H0Z"
            ></path>
          </svg>
        </div>
      </div>

      {/* Hear From Moms Section */}
      <div className="relative bg-[#F7F7C2] text-black py-20 px-16">
        {/* Heading */}
        <h2
          className="text-5xl font-bold text-gray-900 text-left mb-12"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Hear From Moms
        </h2>

        {/* Testimonials Section */}
        <div className="relative bg-[#f7f7c2] py-20">
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-10 px-6">
            <div>
              <h3
                className="text-3xl font-extrabold text-gray-900"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                Rely.
              </h3>
              <p
                className="text-lg mt-4"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                “I tried to talk to my doctor about feeling overwhelmed, but postpartum depression isn’t something I can go to my family for. I don’t know where to turn for help.”
              </p>
            </div>
            <div>
              <h3
                className="text-3xl font-extrabold text-gray-900"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                Understand.
              </h3>
              <p
                className="text-lg mt-4"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                “My doctor told me to eat more protein and dairy, but I am vegetarian and they do not seem to understand my dilemma - my doctor in India didn’t mention any problems when I was there.”
              </p>
            </div>
            <div>
              <h3
                className="text-3xl font-extrabold text-gray-900"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                Trust.
              </h3>
              <p
                className="text-lg mt-4"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                “Back home, we rely on traditional remedies for morning sickness, but my doctor dismissed them and only suggested medications. I didn’t know what I could trust.”
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TummyTales Info Section - With Double Wave Effect */}
      <div className="relative bg-[#a6a87b] py-20 px-10 text-center">
        {/* Top Curve - Darker Edge */}
        {/* <div className="absolute top-0 left-0 w-full">
          <svg className="w-full h-24 md:h-32 lg:h-40" viewBox="0 0 1440 320V320">
            <path
              fill="#3e3e20"
              d="M0,96L60,106.7C120,117,240,139,360,149.3C480,160,600,160,720,149.3C840,139,960,117,1080,117.3C1200,117,1320,139,1380,149.3L1440,160V0H0Z"
            ></path>
          </svg>
        </div> */}

        {/* Text Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-[#f9f9e8]">
          <p
            className="text-lg md:text-xl leading-relaxed"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Moving to a new country itself presents countless challenges, yet the unique experiences of pregnant women navigating this transition often go unnoticed.
          </p>
          <p
            className="mt-4 text-lg md:text-xl leading-relaxed"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Pregnancy is a time when advice—solicited or not—flows from every direction. However, when that advice is conflicting, shaped by both cultural traditions and unfamiliar medical practices, it can leave one feeling confused, isolated, and uncertain about the right path to take.
          </p>
          <p
            className="mt-4 text-lg md:text-xl leading-relaxed"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            Growing up in a different cultural environment means embracing a distinct set of norms, and adjusting to a new healthcare system and way of life takes time.
          </p>
          <p
            className="mt-4 text-lg md:text-xl leading-relaxed"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            TummyTales was born from our own experiences of seeking guidance and support while finding our footing in a new country. We understand the importance of feeling heard and having a space to ask questions without fear or hesitation.
          </p>
        </div>

        {/* Bottom Curve - Lighter Edge */}
        {/* <div className="absolute bottom-0 left-0 w-full">
          <svg className="w-full h-24 md:h-32 lg:h-40" viewBox="0 0 1440 320">
            <path
              fill="#e0e0a0"
              d="M0,256L80,245.3C160,235,320,213,480,202.7C640,192,800,192,960,202.7C1120,213,1280,235,1360,245.3L1440,256V320H0Z"
            ></path>
          </svg>
        </div> */}
      </div>
      <div className="relative bg-[#a8ab71] py-20 px-6 min-h-screen flex justify-center items-center">
  <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
    {/* Silver Plan */}
    <div className="flex items-center gap-8">
      <div className="relative w-64 h-64 overflow-hidden rounded-[30px]">
        <img src="/Image2.jpg" alt="Silver Plan" className="object-cover w-full h-full" />
      </div>
      <div className="text-left">
        <h3 className="text-3xl font-extrabold text-white uppercase tracking-wider">Silver</h3>
        <p className="text-white text-lg my-3">Get access to 40 weeks of:</p>
        <ul className="text-white text-md list-disc pl-5 leading-relaxed">
          <li>Mom-to-Mom Network</li>
          <li>Keep a Journal</li>
          <li>Daily Food Recommendations</li>
          <li>AI-generated responses</li>
        </ul>
        <div className="relative mt-6 border-2 border-[#a8ab71] p-4 w-52 flex items-center justify-center rounded-lg bg-transparent">
          <span className="bg-[#d4d482] text-[#5a5a30] py-1 px-8 rounded-md font-bold text-lg">$4.99</span>
          {/* <span className="absolute top-2 right-2 text-red-500 text-xl">⚠</span> */}
        </div>
      </div>
    </div>

    {/* Gold Plan */}
    <div className="flex items-center gap-8">
      <div className="relative w-64 h-64 overflow-hidden rounded-[30px]">
        <img src="/Image1.jpg" alt="Gold Plan" className="object-cover w-full h-full" />
      </div>
      <div className="text-left">
        <h3 className="text-3xl font-extrabold text-white uppercase tracking-wider">Gold</h3>
        <p className="text-white text-lg my-3">Get access to 40 weeks of:</p>
        <ul className="text-white text-md list-disc pl-5 leading-relaxed">
          <li>Silver Package Deal</li>
          <li>Discounts on Specialists</li>
          <li>Communicate with OB/GYN’s</li>
          <li>Curated TUMMY Box</li>
        </ul>
        <div className="relative mt-6 border-2 border-[#a8ab71] p-4 w-52 flex items-center justify-center rounded-lg bg-transparent">
          <span className="bg-[#d4d482] text-[#5a5a30] py-1 px-8 rounded-md font-bold text-lg">$8.99</span>
          {/* <span className="absolute top-2 right-2 text-red-500 text-xl">⚠</span> */}
        </div>
      </div>
    </div>
  </div>
</div>
<div
      className="relative w-full h-[400px] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url("/Image3.jpg")' }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <div className="relative text-center text-white">
        <h2 className="text-3xl font-bold mb-2">Subscribe to Our NewsLetter</h2>
        <p className="mb-4">Sign up with your email address to receive news and updates.</p>
        <div className="flex justify-center items-center">
          <input
            type="email"
            placeholder="Email Address"
            className="px-4 py-2 w-80 rounded-l-md text-black outline-none"
          />
          <button className="px-6 py-2 bg-transparent border border-white text-white rounded-r-md hover:bg-white hover:text-black transition">
            Sign Up
          </button>
        </div>
      </div>
      
    </div>
    
    </div>
  );
};

export default HomePage;
