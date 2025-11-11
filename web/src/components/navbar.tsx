import { ChevronRight, User } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <span className="font-semibold text-lg">Secure</span>
      <span className="font-semibold text-lg text-purple-600">Learning</span>
    </div>
  )
}

export function Navbar() {
  return (
    <nav className="h-[5vh] w-screen border-b bg-white">
      <div className="w-full container px-3 py-3">
        <div className="w-[100vw] px-10 flex items-center justify-between">
          {/* Logo/Brand with Breadcrumb */}
          <div className="flex items-center space-x-3">
            <Logo />
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2 text-sm">
              <a 
                href="/campaigns" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Campaigns
              </a>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">Scheduled Campaigns</span>
            </div>
          </div>

          {/* User Profile */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium">John Doe</span>
            <span className="text-xs text-gray-500">Admin</span>
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar