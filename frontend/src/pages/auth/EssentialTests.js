import { React, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChevronDown, FaChevronUp, FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";



const EssentialTests = () => {
  const navigate = useNavigate();
  const textRef = useRef(null);

  useEffect(() => {
    const path = document.querySelector("#curvedPath");
    if (!path) {
      console.warn("Element #curvedPath not found in the DOM.");
      return;
    }
  
    const text = textRef.current;
    if (!text) return;
  
    let pathLength = path.getTotalLength();
  
    const animateText = () => {
      let scrollPosition = (window.scrollY % pathLength) / pathLength;
      let point = path.getPointAtLength(scrollPosition * pathLength);
      text.setAttribute("x", point.x);
      text.setAttribute("y", point.y);
      requestAnimationFrame(animateText);
    };
  
    animateText();
  }, []);
  

  const firstTrimesterTests = [
    {
      title: "Blood Tests",
      description: "Learn about what is included in your first round of blood tests.",
      duration: "0:11",
      image: "/Image5.jpg",
      link: "/blood-test", // Route to BloodTestInfo page
    },
    {
      title: "Urine Tests",
      description: "Why do doctors ask for a urine test each time? Learn more!",
      duration: "0:11",
      image: "/Image4.jpg",
      link: "/urine-test", 
    },
    {
      title: "Dating and Viability Ultrasound",
      description: "Understand what the doctor is looking for in the first ultrasound.",
      duration: "0:11",
      image: "/Image4.jpg",
      link:"/dating-viability",
    },
    {
      title: "Genetic Screening (NIPT and Carrier)",
      description: "Do you want to find out more about how genetic screening works? Take a look here.",
      duration: "0:11",
      image: "/Image4.jpg",
      link:"/genetic-screening",
    },
    {
      title: "Nuchal Translucency (NT) Scan",
      description: "What is the secondary ultrasound within the first trimester needed for? Get to know here.",
      duration: "0:11",
      image: "/Image4.jpg",
      link:"/nuchal-translucency",
    },
  ];
  const SecondTrimesterTests = [
    {
      title: "Maternal Serum Screening(MSS)",
      description: "Introduce your lesson with an optional, short summary. you can edit this excerpt in lesson settings.",
      duration: "0:11",
      image: "/Image6.jpg",
    },
  ];

  const ThirdTrimesterTests = [
    {
      title: "Nuchal Translucency (NT) Scan",
      description: "What is the secondary ultrasound within the first trimester needed for? Get to know here.",
      duration: "0:11",
      image: "/Image7.jpg",
    },
    {
      title: "Nuchal Translucency (NT) Scan",
      description: "What is the secondary ultrasound within the first trimester needed for? Get to know here.",
      duration: "0:11",
      image: "/Image8.jpg",
    },
  ];

  const topics = [
    {
      title: "Developing a Business Plan",
      image: "/Image11.jpeg", // Replace with actual image path
      description: "Describe your lesson with a short summary.",
    },
    {
      title: "Setting up Your Online Presence",
      image: "/Image12.jpeg", // Replace with actual image path
      description: "Describe your lesson with a short summary.",
    },
    {
      title: "Effective Communication",
      image: "/Image13.jpeg", // Replace with actual image path
      description: "Describe your lesson with a short summary.",
    },
  ];

  

  const [openIndex, setOpenIndex] = useState(null);

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  
    const toggleFAQ = (index) => {
      setOpenIndex(openIndex === index ? null : index);
    };
  
    const faqs = [
      {
        question: "Question 1",
        answer:
          "It all begins with an idea. Maybe you want to launch a business. Maybe you want to turn a hobby into something more. Or maybe you have a creative project to share with the world. Whatever it is, the way you tell your story online can make all the difference.",
      },
      {
        question: "Question 2",
        answer:
          "It all begins with an idea. Maybe you want to launch a business. Maybe you want to turn a hobby into something more. Or maybe you have a creative project to share with the world. Whatever it is, the way you tell your story online can make all the difference.",
      },
      {
        question: "Question 3",
        answer:
          "It all begins with an idea. Maybe you want to launch a business. Maybe you want to turn a hobby into something more. Or maybe you have a creative project to share with the world. Whatever it is, the way you tell your story online can make all the difference.",
      },
    ];

  return (
    <div className="min-h-screen bg-[#FFFDE6] text-gray-900 px-6 py-10">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-md">
          Essential Testing Tales
        </h1>
        <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
        Follow along to learn about the various tests available to you, their purposes, and how they may differ from what you're familiar with. We’ll guide you through each test, helping you understand its significance and what to expect. Ask your doctor about these tests and get their recommendation as well!
        </p>
      </div>
        {/* First Trimester */}
        <div className="mt-10 p-6">
  <h2 className="text-2xl font-bold text-gray-800">First Trimester</h2>
  <div className="border-t-2 border-gray-400 my-3"></div>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {firstTrimesterTests.map((test, index) => (
      <div
        key={index}
        className="bg-white shadow-lg rounded-lg overflow-hidden cursor-pointer"
        onClick={() => (window.location.href = test.link)}
      >
        <img src={test.image} alt={test.title} className="w-full h-40 object-cover" />
        <div className="p-4">
          <h3 className="font-semibold text-lg">{test.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{test.description}</p>
          <p className="text-gray-500 text-xs mt-2">{test.duration}</p>
        </div>
      </div>
    ))}
  </div>
</div>

      {/* Second and Third Trimester */}
      <div className="bg-[#FFFDE6] min-h-screen px-6 py-10 text-gray-900">
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800">Second Trimester</h2>
        <div className="border-t-2 border-gray-400 my-3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {SecondTrimesterTests.map((test, index) => (
            <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <img src={test.image} alt={test.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg">{test.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                <p className="text-gray-500 text-xs mt-2">{test.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Third Trimester */}
        <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800">Third Trimester</h2>
        <div className="border-t-2 border-gray-400 my-3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {ThirdTrimesterTests.map((test, index) => (
            <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <img src={test.image} alt={test.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg">{test.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                <p className="text-gray-500 text-xs mt-2">{test.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      <section className="relative bg-[#DCE35B] py-16 px-10 overflow-hidden">
      {/* Moving Text Animation */}
      <div className="absolute top-5 left-0 w-full overflow-hidden">
        <motion.div
          className="whitespace-nowrap text-3xl font-bold text-black"
          initial={{ x: "100%" }}
          animate={{ x: "-100%" }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "linear",
          }}
        >
          ✳ Meet your instructors ✳ Meet your instructors ✳ Meet your instructors ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ ✳ Meet your instructors ✳ 
        </motion.div>
      </div>

     {/* Instructors Content */}
<div className="relative flex flex-col md:flex-row items-center justify-center gap-8 mt-24">
  {/* Image 1 - Mack */}
  <div className="relative">
    <div className="w-[320px] h-[320px] bg-[#DCE35B] rounded-[30%] overflow-hidden shadow-lg">
      <img
        src="/Image10.jpg"
        alt="Mack"
        className="w-full h-full object-cover"
      />
    </div>
    <p className="text-center mt-2 text-black font-semibold text-lg">MACK</p>
  </div>

  {/* Image 2 - Kate */}
  <div className="relative">
    <div className="w-[320px] h-[320px] bg-[#DCE35B] rounded-[30%] overflow-hidden shadow-lg">
      <img
        src="/Image9.jpg"
        alt="Kate"
        className="w-full h-full object-cover"
      />
    </div>
    <p className="text-center mt-2 text-black font-semibold text-lg">KATE</p>
  </div>
</div>
{/* Description */}
      <div className="relative mt-8 text-center max-w-2xl mx-auto text-black">
        <p>
          It all begins with an idea. Maybe you want to launch a business. Maybe
          you want to turn a hobby into something more. Or maybe you have a
          creative project to share with the world.
        </p>
      </div>
</section>
      
    
    <div className="bg-[#B9BE80] py-12 px-6">
      <h2 className="text-center text-3xl font-bold text-white mb-6">
        What you&apos;ll learn
      </h2>
      <div className="flex flex-col md:flex-row justify-center items-center gap-6">
        {topics.map((topic, index) => (
          <div
            key={index}
            className="text-center bg-[#A3A86A] w-[350px] rounded-lg p-4 shadow-md"
          >
            <div className="w-[320px] h-[220px] rounded-xl overflow-hidden shadow-lg mx-auto">
              <img
                src={topic.image}
                alt={topic.title}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => toggleDropdown(index)}
              className="w-full flex items-center justify-between text-lg font-semibold text-white mt-3"
            >
              <span>{topic.title}</span>
              {openIndex === index ? (
                <FaChevronUp className="text-white" />
              ) : (
                <FaChevronDown className="text-white" />
              )}
            </button>
            {openIndex === index && (
              <p className="text-white mt-3">{topic.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
    <div className="min-h-screen flex items-center justify-center bg-[#b3b57a] p-6">
      <div className="max-w-2xl w-full">
        <h2 className="text-center text-3xl font-bold text-white relative">
          Course{" "}
          <span className="relative px-2 bg-[#b3b57a] text-white">
            <span className="absolute inset-0 border-2 border-white rounded-full -z-10"></span>
            FAQ
          </span>
        </h2>

        <div className="mt-8 space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-t border-white">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left flex justify-between items-center py-4 text-white font-bold text-lg"
              >
                {faq.question}
                <span>{openIndex === index ? "−" : "+"}</span>
              </button>
              {openIndex === index && (
                <p className="text-white pb-4">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    
    </div>
  );
};

export default EssentialTests;