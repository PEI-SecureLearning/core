import { useState } from 'react';
import { ArrowLeft, Users, Save, X, UserPlus, Search } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import BasicInfo from './newGroupBasicInfo';
import NewGroupFooter from './newGroupFooter';
import Preview from './newGroupPreview';
import MembersSection from './newGroupMembers';

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Color {
  name: string;
  class: string;
  bg: string;
}


// Main Component
export default function NewUserGroup() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

  // Available users to add (hardcoded)
  const availableUsers: Member[] = [
    { id: "1", name: "Alice Johnson", email: "alice.johnson@company.com", department: "Marketing" },
    { id: "2", name: "Bob Smith", email: "bob.smith@company.com", department: "Sales" },
    { id: "3", name: "Carol White", email: "carol.white@company.com", department: "Marketing" },
    { id: "4", name: "David Brown", email: "david.brown@company.com", department: "Engineering" },
    { id: "5", name: "Emma Davis", email: "emma.davis@company.com", department: "Marketing" },
    { id: "6", name: "Frank Miller", email: "frank.miller@company.com", department: "Design" },
    { id: "7", name: "Grace Lee", email: "grace.lee@company.com", department: "HR" },
    { id: "8", name: "Henry Wilson", email: "henry.wilson@company.com", department: "Sales" },
  ];

  const colors: Color[] = [
    { name: 'purple', class: 'from-purple-400 to-purple-600', bg: 'bg-purple-500' },
    { name: 'blue', class: 'from-blue-400 to-blue-600', bg: 'bg-blue-500' },
    { name: 'green', class: 'from-green-400 to-green-600', bg: 'bg-green-500' },
    { name: 'pink', class: 'from-pink-400 to-pink-600', bg: 'bg-pink-500' },
    { name: 'orange', class: 'from-orange-400 to-orange-600', bg: 'bg-orange-500' },
    { name: 'teal', class: 'from-teal-400 to-teal-600', bg: 'bg-teal-500' },
  ];

  const filteredUsers = availableUsers.filter(user => 
    !selectedMembers.find(m => m.id === user.id) &&
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addMember = (user: Member) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery('');
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== userId));
  };

  const handleSubmit = () => {
    if (!groupName || selectedMembers.length === 0) return;
    
    console.log({
      groupName,
      description,
      color: selectedColor,
      members: selectedMembers,
    });
  };

  const selectedColorClass = colors.find(c => c.name === selectedColor)?.class || colors[0].class;

  return (
    <div className='h-full w-full'>
        <div className='h-1/12 border-b py-2 px-5'>
            <h3 className="text-xl font-semibold text-gray-900">Create a new group</h3>
            <h2 className="text-l font-medium text-gray-700">Set up a new group for your campaigns</h2>

        </div>
        <div className='h-10/12 flex row'>
            <div className='h-full w-5/6 items-center justify-center px-5 py-5 overflow-y-auto gap-4 space-y-6'>
                <div className='h-2/3 w-full'>
                    <BasicInfo
                        groupName={groupName}
                        description={description}
                        selectedColor={selectedColor}
                        colors={colors}
                        onGroupNameChange={setGroupName}
                        onDescriptionChange={setDescription}
                        onColorSelect={setSelectedColor}
                    />
                </div>
                <div className='h-full w-full'>
                    <MembersSection
                    searchQuery={searchQuery}
                    filteredUsers={filteredUsers}
                    selectedMembers={selectedMembers}
                    setSelectedMembers={setSelectedMembers}
                    selectedColorClass={selectedColorClass}
                    onSearchChange={setSearchQuery}
                    onAddMember={addMember}
                    onRemoveMember={removeMember}
                    />
                </div>
            </div>

            <div className='h-full w-2/6 py-5 px-5'>
                <Preview groupName={groupName}
                  selectedColor={selectedColor}
                  selectedColorClass={selectedColorClass}
                  selectedMembersCount={selectedMembers.length}
                  description={description}/>
            </div>
        </div>
        <div className='h-1/12 border-t py-4 bg-gray-50'>
            <NewGroupFooter 
              onSubmit={handleSubmit}
              groupName={groupName}
              selectedMembersCount={selectedMembers.length}
            />
        </div>
    </div>
  );
}