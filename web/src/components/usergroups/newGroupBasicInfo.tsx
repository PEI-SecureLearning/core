import { memo } from "react";
import RequiredAsterisk from "@/components/shared/RequiredAsterisk";

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
}: Readonly<BasicInfoSectionProps>) {

    const isGroupNameValid = groupName.trim().length > 0;

    return (
        <div className="bg-surface border border-border rounded-lg h-full w-full p-6">
            <div className="w-full items-center justify-center flex flex-col">
                {/* Group Name Input */}
                <div className="w-full">
                    <label htmlFor="groupName" className="block text-sm font-semibold text-foreground/90 mb-2 tracking-wide">
                        Group Name <RequiredAsterisk isValid={isGroupNameValid} />
                    </label>
                    <input
                        type="text"
                        id="groupName"
                        value={groupName}
                        onChange={(e) => onGroupNameChange(e.target.value)}
                        placeholder="e.g., Marketing Team"
                        className="w-full px-4 py-3 rounded-md bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                </div>

                {/* Description Input */}
                <div className="w-full mt-5">
                    <label htmlFor="description" className="block text-sm font-semibold text-foreground/90 mb-2 tracking-wide">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        rows={4}
                        placeholder="Describe the purpose of this group..."
                        className="w-full px-4 py-3 rounded-md bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Help others understand what this group is for
                    </p>
                </div>
            </div>
        </div>
    );
}

export default memo(BasicInfo);