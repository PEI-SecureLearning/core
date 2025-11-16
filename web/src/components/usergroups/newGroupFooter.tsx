import { Link } from '@tanstack/react-router';
import {Save} from 'lucide-react';

// Footer Component
interface NewGroupFooterProps {
  onSubmit: () => void;
  groupName: string;
  selectedMembersCount: number;
}


export default function NewGroupFooter({ onSubmit, groupName, selectedMembersCount }: NewGroupFooterProps) {
  return (
    <div className="flex gap-3 justify-end sticky bottom-0  px-50">
      <Link
        to="/usergroups"
        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
      >
        Cancel
      </Link>
      <button
        onClick={onSubmit}
        disabled={!groupName || selectedMembersCount === 0}
        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Save className="h-4 w-4" />
        Create Group
      </button>
    </div>
  );
}
