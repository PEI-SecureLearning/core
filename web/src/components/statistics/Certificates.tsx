import { Award, ExternalLink } from "lucide-react";

export default function CertificatesList() {
  const certificates = [
    { id: 1, name: 'Cybersecurity Fundamentals', validUntil: '27/08/2026', href: '#' },
    { id: 2, name: 'Phishing Prevention Expert', validUntil: '15/03/2027', href: '#' },
    { id: 3, name: 'Data Protection Specialist', validUntil: '10/11/2026', href: '#' },
    { id: 4, name: 'Security Awareness Leader', validUntil: '22/06/2028', href: '#' },
    { id: 5, name: 'Incident Response Pro', validUntil: '22/06/2028', href: '#' }
  ];

  return (
    <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
          <Award size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Your Certificates</h3>
          <p className="text-[13px] text-slate-500">{certificates.length} earned certificates</p>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-3 max-h-56 overflow-y-auto purple-scrollbar">
        {certificates.map((cert) => (
          <a
            key={cert.id}
            href={cert.href}
            className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50/80 to-amber-50/30 border border-slate-100/60 hover:border-amber-200/60 hover:from-amber-50/50 hover:to-orange-50/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Award size={16} className="text-amber-600" />
              </div>
              <span className="text-[14px] font-medium text-slate-700 group-hover:text-amber-700 transition-colors">
                {cert.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                Valid until: {cert.validUntil}
              </span>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}