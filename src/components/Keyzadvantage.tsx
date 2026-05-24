const ADVANTAGES = [
  {
    title: "Verified listings",
    description: "Every property and user is verified for a safe and trustworthy experience",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M22 4L8 10V22C8 30.837 14.268 39.066 22 41C29.732 39.066 36 30.837 36 22V10L22 4Z" stroke="#1a237e" strokeWidth="2" />
        <path d="M16 22L20 26L28 18" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Secure Escrow Payments",
    description: "Your payments are protected with escrow until both parties fulfill their commitments",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect x="10" y="20" width="24" height="18" rx="2" stroke="#1a237e" strokeWidth="2" />
        <path d="M15 20V15C15 10.582 18.582 7 23 7V7C27.418 7 31 10.582 31 15V20" stroke="#1a237e" strokeWidth="2" />
        <circle cx="23" cy="29" r="3" stroke="#1a237e" strokeWidth="2" />
        <path d="M23 32V35" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Dispute Resolution",
    description: "Our support team is here to help resolve issues quickly and fairly.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="14" stroke="#1a237e" strokeWidth="2" />
        <path d="M18 18C18 15.791 19.791 14 22 14C24.209 14 26 15.791 26 18C26 20.5 24 21.5 22 22V24" stroke="#1a237e" strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="28" r="1.5" fill="#1a237e" />
      </svg>
    ),
  },
];

export default function KeyzAdvantage() {
  return (
    <section className="py-24 px-4 bg-[#f7f7f8]">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-gray-800 font-semibold tracking-[0.25em] uppercase text-sm mb-4">
          Keyz Advantage
        </p>
        <h2 className="text-[#1a237e] text-3xl font-bold mb-16">
          Built for trust. Designed for you
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ADVANTAGES.map(({ title, description, icon }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-8 flex flex-col items-start text-left shadow-sm border border-gray-100"
            >
              <div className="w-20 h-20 rounded-full bg-[#fdf6ee] flex items-center justify-center mb-6">
                {icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}