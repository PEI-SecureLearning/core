import { ArrowLeft, Users, Mail, Calendar, Edit, Trash2, UserPlus, Send } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function UserGroupDetail() {
  // Hardcoded data
  const group = {
    id: "1",
    name: "Marketing Team",
    description: "This group includes all members of the marketing department responsible for campaigns, social media, and brand management.",
    color: "purple",
    memberCount: 24,
    createdDate: "January 15, 2024",
    lastUpdated: "2 days ago",
  };

  const members: Member[] = [
    { id: "1", name: "Alice Johnson", email: "alice.johnson@company.com", role: "Team Lead" },
    { id: "2", name: "Bob Smith", email: "bob.smith@company.com", role: "Marketing Specialist" },
    { id: "3", name: "Carol White", email: "carol.white@company.com", role: "Content Creator" },
    { id: "4", name: "David Brown", email: "david.brown@company.com", role: "SEO Specialist" },
    { id: "5", name: "Emma Davis", email: "emma.davis@company.com", role: "Social Media Manager" },
    { id: "6", name: "Frank Miller", email: "frank.miller@company.com", role: "Graphic Designer" },
    { id: "7", name: "Grace Lee", email: "grace.lee@company.com", role: "Marketing Analyst" },
    { id: "8", name: "Henry Wilson", email: "henry.wilson@company.com", role: "Copywriter" },
  ];

  const recentCampaigns = [
    { id: "1", name: "Q4 Product Launch", sentDate: "Nov 10, 2024", recipients: 24, status: "Completed" },
    { id: "2", name: "Holiday Promotion", sentDate: "Nov 5, 2024", recipients: 24, status: "Completed" },
    { id: "3", name: "Weekly Newsletter", sentDate: "Nov 1, 2024", recipients: 24, status: "Completed" },
  ];

  const colorClasses = {
    purple: "from-purple-400 to-purple-600",
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/usergroups"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${colorClasses.purple} flex items-center justify-center shadow-md`}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{group.name}</h1>
                <p className="text-sm text-gray-500">{group.memberCount} members</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Group Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this group</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{group.description}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">{group.createdDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">{group.lastUpdated}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h2>
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-900 text-sm mb-1">{campaign.name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{campaign.sentDate}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Members</h2>
                <p className="text-sm text-gray-500 mt-1">{members.length} total members</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        index !== members.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{member.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}