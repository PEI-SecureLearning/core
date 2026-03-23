import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useKeycloak } from '@react-keycloak/web';
import { BookOpen, Users, Calendar, Loader2 } from 'lucide-react';
import Stepper, { Step } from '@/components/ui/Stepper';
import { fetchCourses, type Course } from '@/services/coursesApi';
import { enrollUser } from '@/services/progressApi';
import { toast } from 'sonner';
import { fetchGroups, fetchGroupMembers } from '@/services/userGroupsApi';
import CourseSelectionStep from '@/components/courses/assign/CourseSelectionStep';
import UserGroupSelectionStep from '@/components/courses/assign/UserGroupSelectionStep';
import SchedulingStep from '@/components/courses/assign/SchedulingStep';

export const Route = createFileRoute('/courses/assign')({
    component: AssignCoursesPage,
})

const API_BASE = import.meta.env.VITE_API_URL;

function AssignCoursesPage() {
    const { keycloak } = useKeycloak();
    const navigate = useNavigate();

    const realm = useMemo(() => {
        const iss = (keycloak.tokenParsed as any)?.iss;
        if (!iss) return '';
        const parts = iss.split('/realms/');
        return parts[1] ?? '';
    }, [keycloak.tokenParsed]);

    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [groupMembersMap, setGroupMembersMap] = useState<Record<string, string[]>>({});
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [deadline, setDeadline] = useState<string>('');
    const [certValidDays, setCertValidDays] = useState<number>(365);


    useEffect(() => {
        if (!keycloak.token) return;

        fetchCourses({ token: keycloak.token, limit: 100 })
            .then(data => setCourses(data.items))
            .catch(() => toast.error("Failed to load courses"))
            .finally(() => setLoadingCourses(false));

        if (realm) {
            fetchGroups(realm, keycloak.token)
                .then(async (data) => {
                    const loadedGroups = data.groups || [];
                    setGroups(loadedGroups);

                    // Fetch members for each group to map them
                    const memberMap: Record<string, string[]> = {};
                    await Promise.all(loadedGroups.map(async (g) => {
                        if (g.id) {
                            try {
                                const membersRes = await fetchGroupMembers(realm, g.id, keycloak.token);
                                memberMap[g.id] = (membersRes.members || []).map(m => m.id).filter(Boolean) as string[];
                            } catch (e) {
                                console.error(`Failed to load members for group ${g.name}`, e);
                            }
                        }
                    }));
                    setGroupMembersMap(memberMap);
                })
                .catch(() => toast.error("Failed to load user groups"))
                .finally(() => setLoadingGroups(false));
        }
    }, [keycloak.token, realm]);

    // Fetch cover image presigned URLs
    useEffect(() => {
        let cancelled = false;
        const coverIds = Array.from(new Set(courses.map(c => c.cover_image).filter(Boolean))) as string[];
        if (coverIds.length === 0) {
            setCoverUrls({});
            return;
        }
        const headers = { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '' };
        Promise.all(
            coverIds.map(async (id) => {
                try {
                    const res = await fetch(`${API_BASE}/content/${encodeURIComponent(id)}/file-url`, { headers });
                    if (!res.ok) return [id, ''] as const;
                    const data = await res.json() as { url: string | null };
                    return [id, data.url ?? ''] as const;
                } catch {
                    return [id, ''] as const;
                }
            })
        ).then((entries) => {
            if (!cancelled) setCoverUrls(Object.fromEntries(entries.filter(([, v]) => v)));
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [courses, keycloak.token]);

    const handleCourseToggle = (id: string) => {
        setSelectedCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };


    const handleGroupToggle = (groupId: string) => {
        const memberIds = groupMembersMap[groupId] || [];
        if (memberIds.length === 0) return;

        // Are all group members already selected?
        const allSelected = memberIds.every(id => selectedUsers.includes(id));

        if (allSelected) {
            // Deselect all members of this group
            setSelectedUsers(prev => prev.filter(id => !memberIds.includes(id)));
        } else {
            // Select all members of this group
            setSelectedUsers(prev => Array.from(new Set([...prev, ...memberIds])));
        }
    };

    // Check if a group should appear as "selected" based on its members
    const isGroupSelected = (groupId: string) => {
        const memberIds = groupMembersMap[groupId] || [];
        if (memberIds.length === 0) return false;
        return memberIds.every(id => selectedUsers.includes(id));
    };

    // Check if some members of a group are selected (for partial state)
    const isGroupPartial = (groupId: string) => {
        const memberIds = groupMembersMap[groupId] || [];
        if (memberIds.length === 0) return false;
        const selectedCount = memberIds.filter(id => selectedUsers.includes(id)).length;
        return selectedCount > 0 && selectedCount < memberIds.length;
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (selectedCourses.length === 0) {
                toast.error("Please select at least one course");
                return false;
            }
            return true;
        }
        if (step === 2) {
            if (selectedUsers.length === 0) {
                toast.error("Please select at least one user");
                return false;
            }
            return true;
        }
        return true;
    };

    const handleComplete = async () => {
        if (!keycloak.token || !realm) return false;

        try {
            // Enroll each selected user in the chosen courses
            const promises = selectedUsers.map(userId =>
                enrollUser(realm, userId, selectedCourses, keycloak.token!, deadline ? new Date(deadline).toISOString() : undefined, startDate ? new Date(startDate).toISOString() : undefined, certValidDays)
            );

            await Promise.all(promises);
            toast.success("Courses assigned successfully");
            navigate({ to: '/courses/manage' });
            return true;
        } catch (e) {
            toast.error("Failed to assign courses");
            return false;
        }
    };

    if (loadingCourses || loadingGroups) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-surface-subtle overflow-hidden ">
            <div className="w-full flex-col flex gap-4 h-full">

                <div className="flex-1 border border-border shadow-sm overflow-hidden min-h-0 bg-card animate-[fadeIn_0.5s_ease-out]">
                    <Stepper
                        initialStep={1}
                        onBeforeComplete={handleComplete}
                        validateStep={validateStep}
                        stepIcons={[BookOpen, Users, Calendar]}
                    >
                        <Step>
                            <CourseSelectionStep
                                courses={courses}
                                selectedCourses={selectedCourses}
                                onCourseToggle={handleCourseToggle}
                                coverUrls={coverUrls}
                            />
                        </Step>

                        <Step>
                            <UserGroupSelectionStep
                                groups={groups}
                                groupMembersMap={groupMembersMap}
                                selectedUsers={selectedUsers}
                                onGroupToggle={handleGroupToggle}
                                isGroupSelected={isGroupSelected}
                                isGroupPartial={isGroupPartial}
                            />
                        </Step>

                        <Step>
                                <SchedulingStep
                                startDate={startDate}
                                setStartDate={setStartDate}
                                deadline={deadline}
                                setDeadline={setDeadline}
                                certValidDays={certValidDays}
                                setCertValidDays={setCertValidDays}
                                selectedCoursesCount={selectedCourses.length}
                                selectedUsersCount={selectedUsers.length}
                            />
                        </Step>
                    </Stepper>
                </div>
            </div>
        </div>
    );
}
