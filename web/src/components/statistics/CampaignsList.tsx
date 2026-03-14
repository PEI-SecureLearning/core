import { ChevronRight } from "lucide-react";

function getResultConfig(result: string) {
  switch (result) {
    case 'Phished':
      return {
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        hoverBg: 'hover:bg-rose-500/15',
        label: 'Phished',
        dot: 'bg-rose-500',
      };
    case 'Ignored':
      return {
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        hoverBg: 'hover:bg-amber-500/15',
        label: 'Ignored',
        dot: 'bg-amber-400',
      };
    case 'Reported':
      return {
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        hoverBg: 'hover:bg-emerald-500/15',
        label: 'Reported',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        color: 'text-muted-foreground',
        bg: 'bg-muted-foreground/30',
        hoverBg: 'hover:bg-muted-foreground/30',
        label: result,
        dot: 'bg-muted-foreground/40',
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
    <div className="flex-1 bg-background/60 backdrop-blur-xl rounded-b-xl border-t-3 border-primary
      shadow-lg shadow-slate-300/50 p-6
      hover:shadow-2xl hover:shadow-purple-200/60
      transition-all duration-500 group">
      <style>{`
        .campaign-row {
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .campaign-row:hover {
          transform: translateX(4px);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Campaigns</h3>
            <p className="text-[13px] text-muted-foreground">{campaigns.length} phishing simulations</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
            {phishedCount} phished
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            {reportedCount} reported
          </span>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto purple-scrollbar overflow-x-hidden">
        {campaigns.map((campaign) => {
          const config = getResultConfig(campaign.result);

          return (
            <a
              key={campaign.id}
              href={campaign.detailsLink}
              className="campaign-row group/row flex items-center justify-between p-3.5 rounded-xl
                bg-surface-subtle/60 border border-border/40/60
                hover:border-primary/30/70 hover:bg-primary/10/40
                hover:shadow-md hover:shadow-purple-100/60"
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[14px] font-medium text-foreground/90 group-hover/row:text-primary transition-colors duration-200 block">
                    {campaign.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">{campaign.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
                  <span className={`text-[12px] font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <ChevronRight size={15} className="text-muted-foreground/50 group-hover/row:text-primary/90 group-hover/row:translate-x-0.5 transition-all duration-200" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}