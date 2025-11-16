import { useState } from "react";
import UserGroupsHeader from "@/components/usergroups/userGroupsHeader"
import UserGroupsGrid from "@/components/usergroups/userGroupsGrid";
import UserGroupsTable from "@/components/usergroups/userGroupsTable";

export default function UserGroupsPage() {
    const [view, setView] = useState<'grid' | 'table'>('grid');

    return (
        <div className="h-full w-full">
            <div className="h-1/12 w-full border-b flex items-center px-4 font-semibold text-lg">
                <UserGroupsHeader view={view} setView={setView} />
            </div>
            <div className="h-11/12 w-full overflow-y-auto">
                {view === 'grid' && <UserGroupsGrid />}
                {view === 'table' && <UserGroupsTable />}
            </div>

        </div>
    )
}


