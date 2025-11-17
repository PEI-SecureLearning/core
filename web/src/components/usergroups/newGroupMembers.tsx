import { useState } from "react";
import { Users, X, UserPlus, Search } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface MembersSectionProps {
  searchQuery: string;
  filteredUsers: Member[];
  selectedMembers: Member[];
  selectedColorClass: string;
  setSelectedMembers: React.Dispatch<React.SetStateAction<Member[]>>; 
  onSearchChange: (query: string) => void;
  onAddMember: (user: Member) => void;
  onRemoveMember: (userId: string) => void;
}

export default function MembersSection({
  searchQuery,
  filteredUsers,
  selectedMembers,
  selectedColorClass,
  setSelectedMembers,
  onSearchChange,
  onAddMember,
  onRemoveMember,
}: MembersSectionProps) {


  const handleFileSelect = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", { // replace with your endpoint
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload CSV");
      const data: Member[] = await res.json();
      setSelectedMembers(data)
      console.log(selectedMembers.length)
      // Optionally filter immediately based on current search
    } catch (err) {
      console.error(err);
      alert("Error uploading CSV");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex row w-full mb-4">
        <h2 className="w-1/2 text-lg font-semibold text-gray-900">Add Members</h2>
        <div className="w-1/2 flex justify-end">
          <label className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded-lg cursor-pointer hover:bg-green-600 transition">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          placeholder="Search by name, email, or department..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Search Results */}
      {searchQuery && filteredUsers.length > 0 && (
        <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredUsers.slice(0, 5).map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleAddMember(user)}
              className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <UserPlus className="h-4 w-4 text-purple-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Selected Members */}
      <div className="">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Selected Members ({selectedMembers.length})
        </p>
        {selectedMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No members added yet</p>
            <p className="text-xs text-gray-400 mt-1">Search and add members to this group</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-br ${selectedColorClass} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                  >
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-sm text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
