import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useKeycloak } from '@react-keycloak/web';
import { BookOpen, Users, Calendar, Loader2 } from 'lucide-react';
import Stepper, { Step } from '@/components/ui/Stepper';
import { fetchCourses, type Course } from '@/services/coursesApi';
import { enrollUser } from '@/services/progressApi';
import { toast } from 'sonner';

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
    const [users, setUsers] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [deadline, setDeadline] = useState<string>('');

    useEffect(() => {
        if (!keycloak.token) return;
        
        fetchCourses({ token: keycloak.token, limit: 100 })
            .then(data => setCourses(data.items))
            .catch(() => toast.error("Failed to load courses"))
            .finally(() => setLoadingCourses(false));

        if (realm) {
            fetch(`${API_BASE}/org-manager/${encodeURIComponent(realm)}/users`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            })
            .then(res => res.json())
            .then(data => setUsers(data.users || []))
            .catch(() => toast.error("Failed to load users"))
            .finally(() => setLoadingUsers(false));
        }
    }, [keycloak.token, realm]);

    const handleCourseToggle = (id: string) => {
        setSelectedCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handleUserToggle = (id: string) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
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
            const promises = selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                const targetId = user?.username || userId;
                return enrollUser(realm, targetId, selectedCourses, keycloak.token!, deadline ? new Date(deadline).toISOString() : undefined);
            });
            
            await Promise.all(promises);
            toast.success("Courses assigned successfully");
            navigate({ to: '/courses/manage' });
            return true;
        } catch (e) {
            toast.error("Failed to assign courses");
            return false;
        }
    };

    if (loadingCourses || loadingUsers) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-surface-subtle p-6 overflow-hidden animate-[fadeIn_0.5s_ease-out]">
            <div className="max-w-5xl w-full flex-col flex gap-4 h-full">
                <div>
                   <h1 className="text-2xl font-bold text-foreground">Assign Courses</h1>
                   <p className="text-muted-foreground text-sm">Select courses and users to assign training.</p>
                </div>
                
                <div className="flex-1 rounded-2xl border border-border shadow-sm overflow-hidden min-h-0 bg-card">
                    <Stepper
                        initialStep={1}
                        onBeforeComplete={handleComplete}
                        validateStep={validateStep}
                        stepIcons={[BookOpen, Users, Calendar]}
                    >
                        <Step>
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Select Courses</h2>
                                    <p className="text-sm text-muted-foreground">Choose one or more courses to assign.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                                    {courses.map(course => (
                                        <div 
                                            key={course.id}
                                            onClick={() => handleCourseToggle(course.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCourses.includes(course.id) ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedCourses.includes(course.id)}
                                                        readOnly
                                                        className="w-4 h-4 rounded-sm border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-foreground">{course.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {courses.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-muted-foreground">No courses available.</div>
                                    )}
                                </div>
                            </div>
                        </Step>
                        
                        <Step>
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Select Users</h2>
                                    <p className="text-sm text-muted-foreground">Choose who will receive these courses.</p>
                                </div>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {users.map(user => (
                                        <div 
                                            key={user.id}
                                            onClick={() => handleUserToggle(user.id)}
                                            className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${selectedUsers.includes(user.id) ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUsers.includes(user.id)}
                                                readOnly
                                                className="w-4 h-4 rounded-sm border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{user.firstName} {user.lastName} <span className="text-muted-foreground font-normal ml-1">({user.username})</span></p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {users.length === 0 && (
                                        <div className="py-8 text-center text-muted-foreground">No users found.</div>
                                    )}
                                </div>
                            </div>
                        </Step>

                        <Step>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Set Deadline</h2>
                                    <p className="text-sm text-muted-foreground">Choose a deadline for completion. Leave blank for default 30 days.</p>
                                </div>
                                
                                <div className="max-w-md">
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Deadline Date</label>
                                    <input 
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">Assigned courses will appear expired if incomplete by this date.</p>
                                </div>
                            </div>
                        </Step>
                    </Stepper>
                </div>
            </div>
        </div>
    );
}
