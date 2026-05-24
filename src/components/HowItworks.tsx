const STEPS = [
  {
    step: 1,
    title: "Search or List",
    description: "Browse verified properties or list your properties in minutes",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="13" stroke="#1a237e" strokeWidth="2.5" />
        <path d="M31 31L42 42" stroke="#1a237e" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Connect & Agree",
    description: "Connect with the right people and agree on terms securely",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M36 18C36 24.627 30.627 30 24 30C17.373 30 12 24.627 12 18C12 11.373 17.373 6 24 6C30.627 6 36 11.373 36 18Z" stroke="#1a237e" strokeWidth="2.5" />
        <path d="M19 18L23 22L31 14" stroke="#1a237e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Secure & Complete",
    description: "Make sure payments, sign agreements and move in with peace of mind",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6L10 12V24C10 32.837 16.268 41.066 24 43C31.732 41.066 38 32.837 38 24V12L24 6Z" stroke="#1a237e" strokeWidth="2.5" />
        <path d="M18 24L22 28L30 20" stroke="#1a237e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-[#1a237e] font-bold tracking-[0.2em] uppercase text-sm mb-3">
          How It Works
        </p>
        <p className="text-gray-700 text-lg mb-16">A simpler way to find or list property</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {STEPS.map(({ step, title, description, icon }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4">
              {/* Circle icon background */}
              <div className="w-40 h-40 rounded-full bg-[#fdf6ee] flex items-center justify-center mb-2">
                {icon}
              </div>

              {/* Step badge */}
              <div className="w-8 h-8 rounded-full bg-[#1a237e] text-white text-sm font-bold flex items-center justify-center -mt-6">
                {step}
              </div>

              <h3 className="text-[#1a237e] font-bold text-lg">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[220px]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}