import React from 'react';

const essentials = [
  {
    title: 'SRIMANTHAM/ GODH BHARAYI / VALAKAAPU SAMPRADAYAM',
    img: process.env.PUBLIC_URL + '/image19.jpg',
  },
  {
    title: 'DHUPAN / SMOKE FUMIGATION',
    img: process.env.PUBLIC_URL + '/image19.jpg',
  },
  {
    title: 'NAMING CEREMONY',
    img: process.env.PUBLIC_URL + '/image19.jpg',
  },
  {
    title: 'POST-NATAL MASSAGE KIT FOR THE BABY AND MOM',
    img: process.env.PUBLIC_URL + '/image19.jpg',
  },
  {
    title: 'ANNAPRASHAN/ MUKHE BHAAT',
    img: process.env.PUBLIC_URL + '/image19.jpg',
  },
];

const CulturalPractices = () => {
  return (
    <>
      
      <section className="relative bg-[#B7B87F] text-white px-8 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold">
            CULTURAL BABY PREP PRACTICES 
            </h2>
          </div>
          <div>
            <p className="text-lg leading-relaxed">
            Being a South Asian pregnant woman in the U.S. can feel overwhelming—but you shouldn’t have to miss out on the traditions you hold close, and neither should your baby.
We’ve got you covered for events, customs, rituals, and the traditional tacit knowledge that nourishes your baby and your prep.
We know the list is diverse—and there’s always room for more. If there’s a practice from your culture that’s missing, reach out to us. Together, we can grow this space to be more inclusive for every tradition, every baby, and every parent.
            </p>
          </div>
        </div>

      
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 150" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#FAF9BE"
              d="M0,96L60,106.7C120,117,240,139,360,149.3C480,160,600,160,720,144C840,128,960,96,1080,85.3C1200,75,1320,85,1380,90.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
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
              <h3 className="text-2xl font-extrabold text-[#373500] underline decoration-[#373500] underline-offset-[0.6rem] mb-4">
                {item.title.toUpperCase()}
              </h3>
              <div className="flex justify-center gap-4">
                <button className="border border-[#373500] px-6 py-2 rounded-md text-[#373500] font-medium hover:bg-[#373500] hover:text-white transition">
                  Book Now
                </button>
                <button className="border border-[#373500] px-6 py-2 rounded-md text-[#373500] font-medium hover:bg-[#373500] hover:text-white transition">
                  Add to Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default CulturalPractices;
