import { Target, AlertTriangle, Eye, CheckCircle, ChevronRight } from "lucide-react";

function getResultConfig(result: string) {
  switch (result) {
    case 'Phished':
      return {
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        Icon: AlertTriangle,
        label: 'Phished'
      };
    case 'Ignored':
      return {
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        Icon: Eye,
        label: 'Ignored'
      };
    case 'Reported':
      return {
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        Icon: CheckCircle,
        label: 'Reported'
      };
    default:
      return {
        color: 'text-slate-600',
        bg: 'bg-slate-500/10',
        Icon: Target,
        label: result
      };
  }
}

export default function RecentCampaigns() {
  const campaigns = [
    { id: 1, name: 'Autumn Campaign', result: 'Phished', date: 'Dec 5, 2024', detailsLink: '#details-1' },
    { id: 2, name: 'Special Campaign', result: 'Ignored', date: 'Dec 3, 2024', detailsLink: '#details-2' },
    { id: 3, name: 'Exec Campaign', result: 'Reported', date: 'Nov 28, 2024', detailsLink: '#details-3' },
    { id: 4, name: 'Winter Campaign', result: 'Phished', date: 'Nov 20, 2024', detailsLink: '#details-4' },
    { id: 5, name: 'Summer Campaign', result: 'Reported', date: 'Nov 15, 2024', detailsLink: '#details-5' },
    { id: 6, name: 'Spring Campaign', result: 'Ignored', date: 'Nov 10, 2024', detailsLink: '#details-6' }
  ];

  const phishedCount = campaigns.filter(c => c.result === 'Phished').length;
  const reportedCount = campaigns.filter(c => c.result === 'Reported').length;

  return (
    <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Recent Campaigns</h3>
            <p className="text-[13px] text-slate-500">{campaigns.length} phishing simulations</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg">
            {phishedCount} phished
          </span>
          <span className="text-[12px] font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            {reportedCount} reported
          </span>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-3 max-h-56 overflow-y-auto purple-scrollbar">
        {campaigns.map((campaign) => {
          const config = getResultConfig(campaign.result);
          const Icon = config.Icon;

          return (
            <a
              key={campaign.id}
              href={campaign.detailsLink}
              className="group flex items-center justify-between p-4 rounded-xl bg-slate-50/60 border border-slate-100/60 hover:border-purple-200/60 hover:bg-purple-50/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon size={16} className={config.color} />
                </div>
                <div>
                  <span className="text-[14px] font-medium text-slate-700 group-hover:text-purple-700 transition-colors block">
                    {campaign.name}
                  </span>
                  <span className="text-[12px] text-slate-400">{campaign.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}