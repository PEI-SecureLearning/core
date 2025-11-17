import CustomScrollbar from "./reusables/Scrollbar";

// missing the endpoint to get the recent campaigns data
// also might have a modal in the details instead of a link with some details - idfk

function getResultColor(result: string) {
  switch (result) {
    case 'Phished':
      return 'text-red-600';
    case 'Ignored':
      return 'text-yellow-600';
    case 'Reported':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

export default function RecentCampaigns() {
const campaigns = [
    { id: 1, name: 'Autumn Campaign', result: 'Phished', link: '#campaign-1', detailsLink: '#details-1' },
    { id: 2, name: 'Special Campaign', result: 'Ignored', link: '#campaign-2', detailsLink: '#details-2' },
    { id: 3, name: 'Exec Campaign', result: 'Reported', link: '#campaign-3', detailsLink: '#details-3' },
    { id: 4, name: 'Autumn Campaign', result: 'Phished', link: '#campaign-4', detailsLink: '#details-4' },
    { id: 5, name: 'Summer Campaign', result: 'Reported', link: '#campaign-5', detailsLink: '#details-5' },
    { id: 6, name: 'Winter Campaign', result: 'Ignored', link: '#campaign-6', detailsLink: '#details-6' }
  ];

  return (
    <div className="w-1/2 bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h2>
      
      <CustomScrollbar maxHeight="16rem">
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className="pb-3 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex items-start justify-between mb-1">
                <a href={campaign.link} className="text-gray-900 font-medium hover:text-purple-600 transition-colors">
                  {campaign.name}
                </a>
                <a href={campaign.detailsLink} className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
                  Details
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 text-sm font-medium">Result:</span>
                <span className={`text-sm font-semibold ${getResultColor(campaign.result)}`}>
                  {campaign.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CustomScrollbar>
    </div>
  );
}