import React, { useRef, useState } from 'react';

const Nutrition = () => {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const nutrientData = [
    { name: 'Protein', value: 25, color: '#8B0000' },
    { name: 'Carbohydrates', value: 35, color: '#E94E1B' },
    { name: 'Fats', value: 30, color: '#E5942B' },
    { name: 'Fiber', value: 10, color: '#F9E1B3' },
  ];

  const R = 50;
  const C = 2 * Math.PI * R;
  let cumulative = 0;
  const slices = nutrientData.map(({ name, value, color }) => {
    const length = (value / 100) * C;
    const slice = {
      name,
      color,
      dashArray: `${length.toFixed(2)} ${(C - length).toFixed(2)}`,
      dashOffset: (-cumulative).toFixed(2),
    };
    cumulative += length;
    return slice;
  });

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="relative px-4 sm:px-6 md:px-8 py-20 bg-[#FAF9BE] overflow-hidden">
        <div className="absolute inset-0 transform -skew-y-3 bg-[#E8E57E]"></div>
        <div className="relative text-center max-w-4xl mx-auto bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold inline-block bg-gradient-to-r from-black via-gray-400 to-gray-700 text-transparent bg-clip-text">
            Nutrition Tracker
          </h1>
        </div>
      </div>

      {/* Why Section */}
      <div className="bg-[#B7B87F] px-4 sm:px-6 md:px-8 py-20 text-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-3 flex justify-center md:justify-start">
            <h2 className="text-5xl uppercase font-extrabold tracking-wider"
              style={{
                WebkitTextFillColor: "transparent",
                WebkitTextStroke: "2px #000000",
              }}
            >
              Why?
            </h2>
          </div>

          <div className="md:col-span-9 space-y-6 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-semibold text-black font-serif">Tracking Your Nutrients</h3>
            <p className="text-lg leading-relaxed">
              Now more than ever, keeping track of your eating habits is a great way to stay on top of your pregnancy health. Your nutrition tracker will serve as a simple guide to monitor the amount of protein, fats, and carbohydrates you’re putting into your body. Our goal is to help you build the healthiest lifestyle possible — one step at a time.
And remember, it’s absolutely okay to indulge in your cravings now and then — after all, that’s part of the joy of pregnancy! Just make sure to log it, so you have a running list you can easily follow.


            </p>

            <h3 className="text-2xl sm:text-3xl font-semibold text-black font-serif">It Matters for South Asian Women</h3>
            <p className="text-lg leading-relaxed">
             For South Asian women, it’s especially important to be mindful of nutrition. Gestational diabetes is a condition that affects how your body processes sugar during pregnancy, which is more common to occur to South Asian women. Genetics, body composition, and traditional dietary patterns high in refined carbohydrates all contribute to this increased risk. However, with the right approach, gestational diabetes can often be managed very effectively through diet and lifestyle changes. Choosing foods that are high in fiber, low in simple sugars, and balanced with healthy proteins and fats can help control blood sugar levels. Eating smaller, more frequent meals, staying active with light exercise, and keeping track of what you eat can make a significant difference. With careful meal planning and healthy food choices, many South Asian women can have a healthy pregnancy and reduce risks for both themselves and their babies.
            </p>

            <h3 className="text-2xl sm:text-3xl font-semibold text-black font-serif">Healthy and Fun</h3>
            <p className="text-lg leading-relaxed">
              You can easily track your daily goals here — just scan the nutrition label from a packet, or scan your meal itself.
Our AI feature will estimate the calories and nutritional breakdown of each meal and snack you enjoy, helping you make informed choices with ease.

Your pregnancy journey should feel empowering, not overwhelming.
 Let’s work together to make it healthy, strong, and full of joyful moments — starting with building simple, sustainable habits that will benefit both you and your baby!
            </p>
          </div>
        </div>
      </div>

      {/* AI Section */}
      <section className="bg-amber-50 py-20 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-olive-800 mb-6">TummyTracker – AI</h2>
            <p className="text-lg text-gray-700 mb-4">
              Meet <strong>TummyTracker AI</strong> — your quick and easy way to track calories and nutrition!
            </p>
            <p className="text-lg text-gray-700 mb-4">
              You can scan a barcode, snap a picture of nutrition labels, or even scan your meal to instantly get detailed insights.

Our powerful AI has been trained to recognize and categorize your food based on key nutritional values like calories, protein, fats, and carbohydrates.

With TummyTracker, reaching your health goals just got smarter, faster, and more fun!
            </p>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="shadow-2xl rounded-3xl overflow-hidden bg-white w-full max-w-md">
              <img src="/cal+ai.jpg" alt="Scanner UI" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Donut Chart Section */}
      <div className="bg-[#B7B87F] py-16 px-4 sm:px-6 md:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 text-center">Complete The Circle</h2>
        <div className="flex flex-col lg:flex-row items-start justify-center gap-16">
          {/* Donut Chart */}
          <div className="flex flex-col items-center">
            <svg className="w-80 h-80 sm:w-96 sm:h-96 transform -rotate-90" viewBox="0 0 200 200">
              {slices.map((slice, i) => (
                <circle
                  key={i}
                  r={R}
                  cx="100"
                  cy="100"
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="40"
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  className={i === slices.length - 1 ? 'cursor-pointer' : ''}
                  onClick={i === slices.length - 1 ? () => fileInputRef.current.click() : undefined}
                />
              ))}
            </svg>

            <ul className="mt-4 text-white space-y-2 text-sm text-left">
              {nutrientData.map(({ name, color }, i) => (
                <li key={i} className="flex items-center">
                  <span className="w-4 h-4 mr-2 block" style={{ backgroundColor: color }} />
                  {name}
                </li>
              ))}
            </ul>

            <button
              onClick={() => fileInputRef.current.click()}
              className="mt-4 px-6 py-2 bg-white text-black font-semibold rounded-lg shadow hover:bg-gray-100 transition"
            >
              Upload Meal Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Upload Preview */}
          <div className="flex flex-col items-center">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Uploaded meal"
                className="w-64 h-40 object-cover rounded-lg shadow-md mb-4"
              />
            ) : (
              <div className="w-64 h-40 bg-white rounded-lg shadow-inner mb-4" />
            )}
            <p className="text-white text-center max-w-xs">
              {selectedImage
                ? 'Here’s what you uploaded!'
                : 'Click “Upload Meal Photo” or the last slice in the donut to add your meal photo.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
