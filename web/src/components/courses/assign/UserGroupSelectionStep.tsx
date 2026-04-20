import { useState, useMemo } from 'react';
import { Layers } from 'lucide-react';
import SearchBar from '@/components/shared/SearchBar';
import DisplayModeToggle from '@/components/shared/DisplayModeToggle';

interface UserGroupSelectionStepProps {
    groups: any[];
    groupMembersMap: Record<string, string[]>;
    selectedUsers: string[];
    onGroupToggle: (groupId: string) => void;
    isGroupSelected: (groupId: string) => boolean;
    isGroupPartial: (groupId: string) => boolean;
}

export default function UserGroupSelectionStep({
    groups,
    groupMembersMap,
    selectedUsers: _selectedUsers,
    onGroupToggle,
    isGroupSelected,
    isGroupPartial
}: UserGroupSelectionStepProps) {
    const [userSearch, setUserSearch] = useState("");
    const [userView, setUserView] = useState<"table" | "grid">("table");

    const filteredGroups = useMemo(() => {
        return groups.filter(group => {
            const query = userSearch.toLowerCase();
            return group.name?.toLowerCase().includes(query);
        });
    }, [groups, userSearch]);

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="shrink-0 space-y-4">
                <div className="flex items-center gap-3 bg-surface/50 p-2.5 rounded-xl border border-border/60">
                    <SearchBar
                        value={userSearch}
                        onChange={setUserSearch}
                        placeholder="Search users by name, email or username..."
                        className="grow"
                        iconClassName="text-primary"
                        inputClassName="h-10 rounded-lg border-border/40"
                    />
                    <DisplayModeToggle
                        value={userView}
                        onChange={setUserView}
                        options={[
                            { value: "table", ariaLabel: "Table view", icon: "table" },
                            { value: "grid", ariaLabel: "Grid view", icon: "grid" },
                        ]}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-primary/20">
                <div className="space-y-6">
                    {/* Groups Section */}
                    {filteredGroups.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Layers className="w-3 h-3" /> User Groups
                            </h3>
                            <div className={`grid gap-3 ${userView === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {filteredGroups.map(group => (
                                    <div
                                        key={group.id}
                                        onClick={() => onGroupToggle(group.id)}
                                        className={`p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all duration-200 ${isGroupSelected(group.id) ? 'border-primary bg-primary/5 shadow-sm' : isGroupPartial(group.id) ? 'border-primary/50 bg-primary/2.5' : 'border-border/60 bg-card hover:border-primary/40'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isGroupSelected(group.id) ? 'bg-primary border-primary text-white' : isGroupPartial(group.id) ? 'bg-primary/20 border-primary/40' : 'border-border bg-background'}`}>
                                            {isGroupSelected(group.id) ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : isGroupPartial(group.id) && (
                                                <div className="w-2 h-0.5 bg-primary rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground truncate">
                                                {group.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate opacity-70">
                                                {groupMembersMap[group.id]?.length || 0} members
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredGroups.length === 0 && (
                        <div className="py-16 text-center">
                            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No groups found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
