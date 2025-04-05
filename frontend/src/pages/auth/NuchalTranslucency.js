import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function GeneticScreening() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#fdfbe5] min-h-screen p-10 flex flex-col gap-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b pb-4">
        <h1 className="text-lg font-extrabold text-gray-700">
          Essential Testing Tales
        </h1>
        <button className="text-sm text-gray-700 hover:text-gray-900 border-b border-gray-700">
          Complete & Continue
        </button>
      </header>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="w-2/3 p-6 bg-[#fdfbe5] text-gray-800">
          <section>
            <h2 className="text-sm font-bold text-gray-700">FIRST TRIMESTER</h2>
            <h1 className="text-3xl font-bold text-gray-800 my-2">
              Nuchal Translucency (NT) Scan
            </h1>
            <p className="text-gray-700 leading-relaxed">
              The ultrasound technician performs a specialized ultrasound that measures the fluid-filled space at the back of the baby's neck. An increased NT measurement can indicate a higher risk of chromosomal abnormalities or congenital heart defects, such as Down Syndrome, Edwards Syndrome, Patau Syndrome, etc. If the NT test is normal, no further testing is required. If it is irregular, you will be communicated with for further testing.
            </p>
          </section>

          <section className="mt-6">
            <h3 className="font-bold text-gray-800">When:</h3>
            <p>11-14 weeks, ideally at <span className="text-gray-700 underline">12 weeks</span></p>
          </section>

          <section className="mt-6 text-gray-800">
            <h3 className="font-bold text-lg">What the NT Scan Checks:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Measures the thickness of the nuchal translucency (fluid behind the baby's neck) in the nuchal folds</li>
              <li>Detects early structural abnormalities</li>
              <li>Helps assess risk for chromosomal disorders when combined with a blood test (first-trimester screening or NIPT)</li>
            </ul>

            <h3 className="font-bold text-lg mt-4">How Results Are Calculated:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                <strong>Combination:</strong> The NT scan results are not assessed in isolation. Your healthcare provider will typically combine them with other 
                <em> first-trimester screenings</em> to determine the overall risk of a congenital condition.
              </li>
              <li>
                <strong>Additional Tests for Accuracy:</strong>
                <ul className="list-[circle] list-inside space-y-1 ml-4">
                  <li><em>A blood test</em> is often done alongside the NT scan to improve screening accuracy.</li>
                  <li>Your <em>age</em> and the <em>fetus's nasal bone</em> may also be considered if blood tests aren’t performed.</li>
                </ul>
              </li>
            </ul>

            <h3 className="font-bold text-lg mt-4">How Results Are Interpreted:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Results are usually presented as a <em>mathematical risk</em> (e.g., <strong>1 in 300</strong> chance of a congenital condition).</li>
              <li>A normal fluid level means a lower risk.</li>
              <li>An increased fluid level suggests a higher chance of a congenital or genetic condition.</li>
            </ul>

            <h3 className="font-bold text-lg mt-4">NT Scan Is Not a Diagnostic Test:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>The NT scan is a screening tool, not a definitive diagnosis.</li>
              <li>
                If results show an increased NT measurement, additional testing options like <em>chorionic villus sampling (CVS)</em> or <em>amniocentesis</em> may be recommended by the genetic counselor.
              </li>
            </ul>
          </section>
        </div>

        {/* Image Section */}
        <section className="w-1/3 flex flex-col items-center p-6">
          {/* First Image */}
          <div className="rounded-lg overflow-hidden shadow-md">
            <img
              src="/Image17.jpeg"
              alt="Genetic Screening"
              width={500}
              height={500}
              className="rounded-lg"
            />
          </div>

          {/* Spacing between images */}
          <div className="h-6" />

          {/* Second Image */}
          <div className="rounded-lg overflow-hidden shadow-md bg-black flex items-center justify-center w-[500px] h-[300px]">
            <img
              src="/Image18.jpg"
              alt="Loading"
              width={40}
              height={40}
              className="opacity-50"
            />
          </div>
        </section>
      </div>

      {/* Additional Resources Section */}
      <div className="bg-[#B5B57A] p-6 text-[#393C1C]">
        <div className="max-w-4xl mx-auto">
          <div
            className="flex justify-between items-center border-t border-white pt-2 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <h3 className="text-lg font-semibold">Additional Resources</h3>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {isOpen && (
            <p className="mt-2 text-sm text-[#393C1C]">
              Add a short summary or a list of helpful resources here.
            </p>
          )}
          <hr className="mt-2 border-white" />
        </div>
        <div className="mt-6 text-center text-[#393C1C]">
        </div>
        
      </div>
      <button className="relative text-sm font-semibold uppercase">
            Complete & Continue
            <span className="block w-full h-[1px] bg-[#393C1C] mt-1"></span>
          </button>
    </div>
  );
}