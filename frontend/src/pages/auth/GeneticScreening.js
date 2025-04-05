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
        <div className="w-2/3 mx-auto p-6 bg-cream text-gray-800">
      <section>
        <h2 className="text-sm font-bold text-gray-700">FIRST TRIMESTER</h2>
        <h1 className="text-3xl font-bold text-gray-800 my-2">
          Genetic Screening (NIPT and Carrier)
        </h1>
        <p className="text-gray-700 leading-relaxed">
          Genetic screening tests are optional but recommended to assess the
          risk of genetic disorders your child may be predisposed to. This
          non-invasive procedure requires only a blood or saliva sample.
          These tests provide valuable insights, allowing you to prepare for
          potential outcomes. If necessary, you will be referred to a genetic
          counselor for further guidance.
        </p>
      </section>

      <section className="mt-6">
        <h3 className="font-bold text-gray-800">When:</h3>
        <p className="text-gray-700 underline">Around 10-12 weeks.</p>
      </section>

      <section className="mt-6">
        <h3 className="font-bold text-gray-800">Types of Screening:</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>
            <strong>Non-invasive Prenatal Testing (NIPT):</strong> During
            pregnancy, small fragments of fetal DNA circulate in the mother’s
            blood. NIPT analyzes these fragments to detect chromosomal
            abnormalities like Down syndrome, Trisomy 18, and Trisomy 13. Know
            that this is a screening test and not a diagnostic test - if the
            NIPT is abnormal, additional testing such as an amniocentesis and
            chorionic villus sampling (CVS) is recommended.
            <br></br>
            <em>
              This test will provide you the fetal sex! If you would like to
              know, ask your doctor for the sex in an envelope.
            </em>
          </li>
          <li>
            <strong>Carrier Screening:</strong> Genetic screening helps inform
            couples about their risk of having a child with a genetic disorder,
            allowing them to make informed decisions about family planning, such
            as prenatal testing or assisted reproductive technologies. This
            process identifies whether parents carry genetic conditions like
            thalassemia, cystic fibrosis, sickle cell anemia, etc. Initially,
            the mother is tested, and if she is found to be a carrier, the
            father is then tested. If both parents carry the same genetic
            disorder, they will be referred to a genetic counselor to discuss
            potential risks and options. However, if there is no overlap in
            genetic conditions, no further action is needed.
          </li>
        </ul>
      </section>
    </div>

        {/* Image Section */}
        <aside className="w-1/3 flex flex-col items-center">
  <img
    src="/Image17.jpeg"
    alt="Genetic Screening"
    className="rounded-lg shadow-md"
  />
  <div className="bg-yellow-100 p-4 mt-4 rounded-lg">
    <p className="text-gray-800 text-sm leading-relaxed">
      In India, genetic screening tests are less common due to their high cost. 
      However, in the U.S., insurance coverage for these tests varies depending on 
      the provider. It is advisable to check with your insurance company and healthcare 
      provider to confirm coverage. We highly recommend these tests for your awareness and benefit!
    </p>
  </div>
</aside>
      </div>
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
          <button className="relative text-sm font-semibold uppercase">
            Complete & Continue
            <span className="block w-full h-[1px] bg-[#393C1C] mt-1"></span>
          </button>
        </div>
      </div>
    </div>
  );
}