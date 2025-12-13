import { memo } from "react";

interface BasicInfoSectionProps {
    groupName: string;
    description: string;
    onGroupNameChange: (name: string) => void;
    onDescriptionChange: (desc: string) => void;
}

// Main component - memoized to prevent re-renders during parent animations
function BasicInfo({
    groupName,
    description,
    onGroupNameChange,
    onDescriptionChange,
}: BasicInfoSectionProps) {
    return (
        <div className="liquid-glass-card h-full w-full p-6 relative z-10">
            <div className="w-full items-center justify-center flex flex-col">
                {/* Group Name Input */}
                <div className="w-full">
                    <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                        Group Name <span className="text-purple-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="groupName"
                        value={groupName}
                        onChange={(e) => onGroupNameChange(e.target.value)}
                        placeholder="e.g., Marketing Team"
                        className="liquid-glass-input w-full px-4 py-3 text-gray-800 placeholder-gray-400"
                    />
                </div>

                {/* Description Input */}
                <div className="w-full mt-5">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        rows={4}
                        placeholder="Describe the purpose of this group..."
                        className="liquid-glass-input w-full px-4 py-3 resize-none text-gray-800 placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-purple-400 rounded-full"></span>
                        Help others understand what this group is for
                    </p>
                </div>
            </div>
        </div>
    );
}

export default memo(BasicInfo);