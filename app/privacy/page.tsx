export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const sections = [
    {
      number: "01",
      title: "Information We Collect",
      content: [
        { label: "Account", text: "Your email address, securely encrypted and never exposed." },
        { label: "Style Profile", text: "Gender, age, height, and weight — used exclusively to personalize your outfit suggestions." },
        { label: "Uploaded Images", text: "Photos submitted for outfit analysis. Processed in real time and never stored permanently." },
        { label: "Usage Data", text: "Analysis count, saved outfits, streaks, and academy progress — stored to power your LEO experience." },
      ],
    },
    {
      number: "02",
      title: "How We Use Your Data",
      content: [
        { label: "Personalization", text: "To generate outfit suggestions tailored to your body, style, and occasion." },
        { label: "Analysis", text: "To evaluate your outfits and deliver honest, professional feedback." },
        { label: "Progress", text: "To track your academy journey, daily streaks, and wardrobe history." },
        { label: "Improvement", text: "To refine the accuracy and intelligence of LEO over time." },
      ],
    },
    {
      number: "03",
      title: "AI Processing",
      content: [
        { label: "Third-Party AI", text: "LEO uses advanced AI services to power style generation and outfit analysis. Your data is transmitted solely for processing — never for training." },
        { label: "Image Handling", text: "Uploaded photos are analyzed in real time. They are not retained after your result is delivered." },
      ],
    },
    {
      number: "04",
      title: "Data Sharing",
      content: [
        { label: "No Selling", text: "We do not sell, rent, or share your personal data with any third party for marketing purposes." },
        { label: "Infrastructure", text: "Data is only shared with trusted service providers essential to operating LEO, under strict confidentiality agreements." },
      ],
    },
    {
      number: "05",
      title: "Security",
      content: [
        { label: "Encryption", text: "All data is transmitted over HTTPS. Passwords are never stored in plain text." },
        { label: "Access Control", text: "Row-level security ensures only you can access your own data — at all times." },
      ],
    },
    {
      number: "06",
      title: "Your Rights",
      content: [
        { label: "Access", text: "View the data associated with your account at any time within the app." },
        { label: "Deletion", text: "Request full deletion of your account and all associated data." },
        { label: "Correction", text: "Update your profile and preferences directly from your LEO dashboard." },
      ],
    },
    {
      number: "07",
      title: "Policy Updates",
      content: [
        { label: "Changes", text: "We may revise this policy as LEO evolves. Updates will be reflected here with a new date. Continued use of LEO constitutes acceptance." },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Hero */}
      <div className="relative border-b border-[#D4AF37]/20 px-6 py-24 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px", height: "300px",
            background: "radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)",
          }} />
        </div>
        <p className="text-xs tracking-[0.4em] text-[#D4AF37]/60 uppercase mb-4">Legal</p>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
          Privacy <span className="text-[#D4AF37]">Policy</span>
        </h1>
        <p className="text-neutral-500 text-sm">Last updated: {updated}</p>
        <p className="mt-6 text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
          At <span className="text-[#D4AF37] font-medium">LEO</span>, privacy is not a feature — it is a standard.
          Here is exactly what we collect, why, and how we protect it.
        </p>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-0">
        {sections.map((section, si) => (
          <div key={si} className="group border-b border-[#D4AF37]/10 py-10">
            <div className="flex items-start gap-6">
              {/* Number */}
              <span className="text-[#D4AF37]/20 text-4xl font-bold leading-none mt-1 select-none shrink-0">
                {section.number}
              </span>
              {/* Content */}
              <div className="flex-1 space-y-5">
                <h2 className="text-lg font-semibold text-white tracking-wide">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((item, ii) => (
                    <div key={ii} className="flex gap-3">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        <span className="text-neutral-200 font-medium">{item.label} — </span>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-[#D4AF37]/20 px-6 py-12 text-center space-y-4">
        <p className="text-[#D4AF37] font-bold tracking-[0.3em] text-lg">LEO</p>
        <p className="text-xs text-neutral-600">Crafted by AI. Worn by Kings.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-[#D4AF37] transition-colors mt-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to LEO
        </a>
      </div>

    </main>
  );
}