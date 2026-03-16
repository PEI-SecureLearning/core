import { ExternalLink } from "lucide-react";

export default function CertificatesList() {
  const certificates = [
    {
      id: 1,
      name: "Cybersecurity Fundamentals",
      validUntil: "27/08/2026",
      href: "#"
    },
    {
      id: 2,
      name: "Phishing Prevention Expert",
      validUntil: "15/03/2027",
      href: "#"
    },
    {
      id: 3,
      name: "Data Protection Specialist",
      validUntil: "10/11/2026",
      href: "#"
    },
    {
      id: 4,
      name: "Security Awareness Leader",
      validUntil: "22/06/2028",
      href: "#"
    },
    {
      id: 5,
      name: "Incident Response Pro",
      validUntil: "22/06/2028",
      href: "#"
    }
  ];

  return (
    <div
      className="flex-1 bg-background/60 backdrop-blur-xl rounded-b-xl border-t-3 border-primary
      shadow-lg shadow-slate-300/50 p-6
      hover:shadow-2xl hover:shadow-purple-200/60
      transition-all duration-500 group"
    >
      <style>{`
        @keyframes certSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .cert-row {
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cert-row:hover {
          transform: translateX(4px);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Your Certificates
          </h3>
          <p className="text-[13px] text-muted-foreground">
            {certificates.length} earned certificates
          </p>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto purple-scrollbar overflow-x-hidden">
        {certificates.map((cert, idx) => (
          <a
            key={cert.id}
            href={cert.href}
            className="cert-row group/row flex items-start sm:items-center justify-between gap-2 p-3.5 rounded-xl
              bg-gradient-to-r from-slate-50/80 to-amber-50/20
              border border-border/40/60
              hover:border-amber-200/70 hover:from-amber-50/60 hover:to-orange-50/40
              hover:shadow-md hover:shadow-amber-100/60"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[14px] font-medium text-foreground/90 group-hover/row:text-amber-700 transition-colors duration-200 break-words">
                {cert.name}
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className="text-[11px] font-semibold text-primary bg-primary/90/8 border border-purple-100/60 px-2.5 py-1 rounded-full
                group-hover/row:bg-primary/20/60 transition-colors duration-200"
              >
                Until {cert.validUntil}
              </span>
              <ExternalLink
                size={13}
                className="text-muted-foreground/50 group-hover/row:text-amber-500 transition-colors duration-200"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
