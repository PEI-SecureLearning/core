import {Users} from 'lucide-react';


// Preview Sidebar
interface PreviewSidebarProps {
  groupName: string;
  selectedColor: string;
  selectedColorClass: string;
  selectedMembersCount: number;
  description: string;
}


export default function Preview({
  groupName,
  selectedColor,
  selectedColorClass,
  selectedMembersCount,
  description
}: PreviewSidebarProps)  {
    return( 
    <div className="h-full border rounded-lg card shadow-lg radius-lg p-6 flex flex-col">
      <div className="h-1/12 flex items-center gap-2 mb-4">
        <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Users className="h-4 w-4 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Preview</h3>
      </div>

      <div className="h-11/12 space-y-4">
        {/* Group Icon Preview */}
        <div className="h-2/6 flex flex-col items-center p-4 bg-gray-50 rounded-lg">
          <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${selectedColorClass} flex items-center justify-center shadow-lg mb-3`}>
            <Users className="h-8 w-8 text-white" />
          </div>
          <p className="font-medium text-gray-900 text-center">
            {groupName || 'Group Name'}
          </p>
          <p className="text-sm text-gray-500">
            {selectedMembersCount} {selectedMembersCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        {/* Info */}
        <div className="h-4/6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Color:</span>
            <span className="font-medium text-gray-900 capitalize">{selectedColor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Members:</span>
            <span className="font-medium text-gray-900">{selectedMembersCount}</span>
          </div>
          {description && (
            <div className="h-3/4 pt-2 border-t border-purple-600">
              <p className="text-gray-600 mb-1">Description:</p>
              <p className="rounded-lg p-4 h-full bg-gray-50 text-gray-700 text-sm leading-relaxed ">
                {description.slice(0, 100)}{description.length > 100 ? '...' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    );
}