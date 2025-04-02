import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function UltrasoundInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#fdfbe5] min-h-screen p-10 flex flex-col gap-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b pb-4">
        <h1 className="text-lg font-extrabold text-gray-700">Essential Testing Tales</h1>
        <button className="text-sm text-gray-700 hover:text-gray-900 border-b border-gray-700">
          Complete & Continue
        </button>
      </header>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="w-2/3">
          <section>
            <h2 className="text-sm font-bold text-gray-700">FIRST TRIMESTER</h2>
            <h1 className="text-3xl font-bold text-gray-800 my-2">Dating and Viability Ultrasound</h1>
            <p className="text-gray-700 leading-relaxed">
              The first trimester ultrasound typically takes place during your initial appointment and is performed transvaginally.
              While the transvaginal probe may appear large, the procedure is painless. During the scan, you will see a magnified image
              of your baby, often in a C-like formation within the sac. This ultrasound aims to confirm pregnancy viability, detect the baby’s heartbeat,
              and estimate the due date. Measurements such as the crown-rump length (CRL) and gestational sac (GS) size are taken to ensure they align with your last ovulation cycle.
            </p>
          </section>

          <section className="mt-6">
            <h3 className="font-bold text-gray-800">When:</h3>
            <p className="text-gray-700">7-9 weeks</p>
          </section>

          <section className="mt-6">
            <h3 className="font-bold text-gray-800">What the Ultrasound Checks:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Number of fetuses (single/multiple pregnancy).</li>
              <li>Location of the pregnancy (rules out ectopic pregnancy).</li>
              <li>Measures fetal size for accurate dating.</li>
            </ul>
          </section>

          <div className="mt-6">
            <img src="/Image16.jpg" alt="Ultrasound" width={400} height={300} className="rounded-md" />
          </div>
        </div>

        {/* Side Panel */}
        <aside className="bg-[#fff9c4] p-6 rounded-lg shadow-md w-1/3 h-fit">
          <h3 className="font-bold text-gray-800">How to Prep for the Initial Appointment:</h3>
          <p className="text-gray-700 mt-2">
            Your first prenatal visit will be longer than usual, as it includes an in-depth discussion with your OB. Here’s what to expect:
          </p>
          <ul className="list-disc list-inside text-gray-700 mt-3 space-y-2">
            <li><strong>Urine Sample</strong> – At the start of your appointment, you’ll be asked to provide a urine sample.</li>
            <li><strong>Medical History Discussion</strong> – Your doctor will ask a series of questions about your gynecological and family history.</li>
            <li>
              <strong>Family History Preparation</strong> – Before your appointment, consider speaking with your mother about her pregnancy history.
              <ul className="list-circle list-inside mt-1 pl-4">
                <li>Did you experience any pregnancy or birth complications?</li>
                <li>Did you have high blood pressure during pregnancy?</li>
                <li>Have you had any pregnancy losses?</li>
              </ul>
            </li>
            <li><strong>Transvaginal Dating and Viability Ultrasound</strong> – Ask for a hard copy or soft copy of the ultrasound to keep for memories!</li>
            <li><strong>Pap Smear (if needed)</strong> – If you are due for a pap smear, it will likely be performed during this appointment. Rest assured, this procedure is completely safe during pregnancy.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            By preparing in advance, you can make your first prenatal visit as smooth and informative as possible!
          </p>
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