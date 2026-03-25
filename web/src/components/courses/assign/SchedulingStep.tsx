import { CalendarDays, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface SchedulingStepProps {
    startDate: string;
    setStartDate: (v: string) => void;
    deadline: string;
    setDeadline: (v: string) => void;
    certValidDays: number;
    setCertValidDays: (v: number) => void;
    selectedCoursesCount: number;
    selectedUsersCount: number;
}

export default function SchedulingStep({
    startDate,
    setStartDate,
    deadline,
    setDeadline,
    certValidDays,
    setCertValidDays,
    selectedCoursesCount,
    selectedUsersCount
}: SchedulingStepProps) {
    const [unit, setUnit] = useState<'days' | 'hours' | 'minutes' | 'seconds'>('days');

    const handleValueChange = (valStr: string) => {
        const val = parseFloat(valStr) || 0;
        let days = val;
        if (unit === 'hours') days = val / 24;
        else if (unit === 'minutes') days = val / 1440;
        else if (unit === 'seconds') days = val / 86400;
        setCertValidDays(days);
    };

    const displayValue = unit === 'days' ? certValidDays : 
                      unit === 'hours' ? Math.round(certValidDays * 24 * 100) / 100 :
                      unit === 'minutes' ? Math.round(certValidDays * 1440 * 100) / 100 :
                      Math.round(certValidDays * 86400);
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="shrink-0">
                <h2 className="text-xl font-semibold text-foreground">Schedule Assignment</h2>
                <p className="text-sm text-muted-foreground">Choose when the courses will be available and when they should be completed.</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6">
                {/* Left Panel - Date Selection */}
                <div className="flex-1 space-y-6 p-6 rounded-2xl border border-border/60 bg-surface/30">
                    <div className="flex items-center gap-2 mb-6">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Timing & Validity</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                            />
                            <p className="text-[10px] text-muted-foreground/70 italic">Courses will be visible starting this date.</p>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                            />
                            <p className="text-[10px] text-muted-foreground/70 italic">Leave blank for default 30-day duration.</p>
                        </div>
                        
                        <div className="space-y-2 sm:col-span-2">
                             <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Certificate Validity</label>
                                <div className="flex bg-muted/30 p-0.5 rounded-lg border border-border/40">
                                    {(['days', 'hours', 'minutes', 'seconds'] as const).map(u => (
                                        <button
                                            key={u}
                                            type="button"
                                            onClick={() => setUnit(u)}
                                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                                                unit === u ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             
                             <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={displayValue}
                                    onChange={(e) => handleValueChange(e.target.value)}
                                    className="flex-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                />
                                <div className="flex items-center px-4 bg-muted/20 border border-border/40 rounded-xl text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[80px] justify-center">
                                    {unit}
                                </div>
                             </div>
                             <p className="text-[10px] text-muted-foreground/70 italic">
                                How long after completion before renewal is required.
                             </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Summary/Context */}
                <div className="w-full md:w-1/3 space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 self-start">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Summary</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Selected Courses</span>
                            <span className="font-semibold">{selectedCoursesCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Assigned Users</span>
                            <span className="font-semibold">{selectedUsersCount}</span>
                        </div>
                        <div className="pt-3 border-t border-primary/10">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Users will receive a notification and courses will appear in their dashboard from the start date until the deadline.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
