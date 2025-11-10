import { LayoutDashboard, Megaphone, FileText, Users, BarChart3, Settings, AlertCircle } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col">

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          <li>
            <a 
              href="/dashboard" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a 
              href="/campaigns" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-purple-700 bg-purple-50 rounded-md font-medium"
            >
              <Megaphone className="h-4 w-4" />
              <span>Campaigns</span>
            </a>
          </li>
          <li>
            <a 
              href="/templates" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </a>
          </li>
          <li>
            <a 
              href="/user-groups" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>User groups</span>
            </a>
          </li>
          <li>
            <a 
              href="/statistics" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Statistics</span>
            </a>
          </li>
          <li>
            <a 
              href="/settings" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer - Report Problem */}
      <div className="px-3 py-4 border-t border-gray-200">
        <a 
          href="/report" 
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Report a problem</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar