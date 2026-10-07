import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    CalendarDays,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Save,
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCw,
    Sparkles,
    Calendar as CalendarIcon,
    Grid,
    Check,
    X,
    AlertCircle,
    BookOpen,
    AlertTriangle,
    MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface ClassDivision {
    division_id: number;
    division_name: string;
    class_name: string;
    class_id: number;
    student_count?: number;
}

interface StudentRecord {
    student_id: number;
    first_name: string;
    last_name: string;
    father_name?: string;
    roll_number: string;
    class_id: number;
    division_id: number;
    class_name: string;
    division_name: string;
    attendance_status?: 'present' | 'absent' | 'not_marked';
}

interface HolidayEntry {
    date: string;
    title: string;
    type: string;
    is_attendance_required: boolean;
}

export function AttendanceRegister() {
    const token = localStorage.getItem('token');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // View state: 'daily' | 'monthly'
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

    // Filters state
    const [classes, setClasses] = useState<ClassDivision[]>([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');

    // Today string YYYY-MM-DD
    const todayStr = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    // Current Month YYYY-MM
    const currentMonthStr = useMemo(() => {
        return todayStr.substring(0, 7);
    }, [todayStr]);

    // Selected date for Daily View
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Selected month for Monthly View
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

    // Daily Mode Data
    const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
    const [dailyStatusMap, setDailyStatusMap] = useState<Record<number, 'present' | 'absent'>>({});
    const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);
    const [isSavingDaily, setIsSavingDaily] = useState<boolean>(false);

    // Monthly Mode Data
    const [monthlyStudents, setMonthlyStudents] = useState<StudentRecord[]>([]);
    const [monthlyAttendanceMap, setMonthlyAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
    const [holidaysMap, setHolidaysMap] = useState<Record<string, HolidayEntry>>({});
    const [daysInMonth, setDaysInMonth] = useState<number>(31);
    const [isLoadingMonthly, setIsLoadingMonthly] = useState<boolean>(false);

    // Pending edit requests map: key = "studentId_YYYY-MM-DD" -> true
    const [pendingRequestsMap, setPendingRequestsMap] = useState<Record<string, boolean>>({});

    // Note dialog for past-date monthly cell clicks
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [noteDialogNote, setNoteDialogNote] = useState('');
    // Pending monthly cell action (awaiting note confirmation)
    const [pendingCellAction, setPendingCellAction] = useState<{
        studentId: number;
        dateKey: string;
        currentKey: string;
        currentStatus: 'present' | 'absent' | undefined;
        newStatus: 'present' | 'absent';
    } | null>(null);

    // Note dialog for daily bulk submit for past date
    const [dailyNoteDialogOpen, setDailyNoteDialogOpen] = useState(false);
    const [dailyNoteNote, setDailyNoteNote] = useState('');

    // Search filter inside table
    const [searchQuery, setSearchQuery] = useState<string>('');

    // 1️⃣ Fetch assigned teacher classes on mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/teacher/attendance/classes`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success && Array.isArray(res.data.data)) {
                    setClasses(res.data.data);
                    if (res.data.data.length > 0) {
                        // Select first division by default if available
                        setSelectedDivisionId(res.data.data[0].division_id.toString());
                    }
                }
            } catch (err) {
                console.error('Failed to fetch classes:', err);
            }
        };
        fetchClasses();
    }, [BACKEND_URL, token]);

    // 2️⃣ Fetch Daily Attendance Data
    const fetchDailyData = async () => {
        if (!selectedDate) return;
        setIsLoadingDaily(true);
        try {
            const divisionParam = selectedDivisionId !== 'all' ? `&division_id=${selectedDivisionId}` : '';
            const res = await axios.get(`${BACKEND_URL}/api/teacher/attendance/status?date=${selectedDate}${divisionParam}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                const fetchedStudents: StudentRecord[] = res.data.students || [];
                setStudentsList(fetchedStudents);

                const initialMap: Record<number, 'present' | 'absent'> = {};
                fetchedStudents.forEach((s) => {
                    if (s.attendance_status === 'present' || s.attendance_status === 'absent') {
                        initialMap[s.student_id] = s.attendance_status;
                    }
                });
                setDailyStatusMap(initialMap);
            }
        } catch (err: any) {
            console.error('Error fetching daily attendance:', err);
            toast.error(err.response?.data?.message || 'Failed to load attendance');
        } finally {
            setIsLoadingDaily(false);
        }
    };

    // 3️⃣ Fetch Monthly Register Data
    const fetchMonthlyData = async () => {
        if (!selectedMonth) return;
        setIsLoadingMonthly(true);
        try {
            const divisionParam = selectedDivisionId !== 'all' ? `&division_id=${selectedDivisionId}` : '';
            const res = await axios.get(`${BACKEND_URL}/api/teacher/attendance/register?month=${selectedMonth}${divisionParam}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                setMonthlyStudents(res.data.students || []);
                setMonthlyAttendanceMap(res.data.attendanceMap || {});
                setHolidaysMap(res.data.holidaysMap || {});
                setDaysInMonth(res.data.daysInMonth || 31);
            }
        } catch (err: any) {
            console.error('Error fetching monthly register:', err);
            toast.error(err.response?.data?.message || 'Failed to load monthly register');
        } finally {
            setIsLoadingMonthly(false);
        }
    };

    // 4️⃣ Fetch teacher's pending edit requests for the selected month
    const fetchPendingRequests = async () => {
        try {
            const divisionParam = selectedDivisionId !== 'all' ? `&division_id=${selectedDivisionId}` : '';
            const res = await axios.get(
                `${BACKEND_URL}/api/teacher/attendance/edit-requests?status=pending&month=${selectedMonth}${divisionParam}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                const map: Record<string, boolean> = {};
                (res.data.data || []).forEach((r: any) => {
                    map[`${r.student_id}_${r.attendance_date}`] = true;
                });
                setPendingRequestsMap(map);
            }
        } catch {
            // silently ignore
        }
    };

    // Trigger data load when filters change
    useEffect(() => {
        if (viewMode === 'daily') {
            fetchDailyData();
        } else {
            fetchMonthlyData();
            fetchPendingRequests();
        }
    }, [viewMode, selectedDate, selectedMonth, selectedDivisionId]);

    // Handlers for Daily Status Toggle
    const handleToggleStudentStatus = (studentId: number, status: 'present' | 'absent') => {
        setDailyStatusMap((prev) => ({
            ...prev,
            [studentId]: status,
        }));
    };

    const handleMarkAll = (status: 'present' | 'absent') => {
        const newMap: Record<number, 'present' | 'absent'> = {};
        filteredDailyStudents.forEach((s) => {
            newMap[s.student_id] = status;
        });
        setDailyStatusMap((prev) => ({ ...prev, ...newMap }));
        toast.info(`Marked all ${filteredDailyStudents.length} students as ${status.toUpperCase()}`);
    };

    const handleResetAll = () => {
        setDailyStatusMap({});
        toast.info('Cleared current selections');
    };

    // Save Daily Attendance
    const handleSaveDailyAttendance = async (note?: string) => {
        if (Object.keys(dailyStatusMap).length === 0) {
            toast.warning('Please mark attendance for at least one student before saving.');
            return;
        }

        const isPastDate = selectedDate < todayStr;

        // For past dates: open note dialog first, then submit
        if (isPastDate && note === undefined) {
            setDailyNoteNote('');
            setDailyNoteDialogOpen(true);
            return;
        }

        setIsSavingDaily(true);
        try {
            const attendanceArray = Object.entries(dailyStatusMap).map(([sId, status]) => ({
                student_id: parseInt(sId, 10),
                status,
            }));

            const res = await axios.post(
                `${BACKEND_URL}/api/teacher/attendance/mark`,
                {
                    date: selectedDate,
                    attendance: attendanceArray,
                    note: note || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                if (res.data.pending_approval) {
                    toast.info('Edit request submitted! Awaiting School Admin approval.', {
                        duration: 5000,
                        icon: '⏳',
                    });
                } else {
                    toast.success(res.data.message || 'Attendance saved successfully!');
                }
                fetchDailyData();
            }
        } catch (err: any) {
            console.error('Failed to save attendance:', err);
            toast.error(err.response?.data?.message || 'Failed to save attendance');
        } finally {
            setIsSavingDaily(false);
        }
    };

    // Actual API call for monthly cell (called after note is provided for past dates)
    const submitMonthlyCellUpdate = async (
        studentId: number,
        dateKey: string,
        currentKey: string,
        currentStatus: 'present' | 'absent' | undefined,
        newStatus: 'present' | 'absent',
        note?: string
    ) => {
        try {
            const res = await axios.patch(
                `${BACKEND_URL}/api/teacher/attendance/update`,
                {
                    student_id: studentId,
                    date: dateKey,
                    status: newStatus,
                    note: note || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                if (res.data.pending_approval) {
                    // Revert optimistic UI — the real attendance hasn't changed yet
                    setMonthlyAttendanceMap((prev) => ({
                        ...prev,
                        [currentKey]: currentStatus as 'present' | 'absent',
                    }));
                    // Mark cell as pending in the pending map
                    setPendingRequestsMap((prev) => ({ ...prev, [currentKey]: true }));
                    toast.info('Edit request submitted — awaiting School Admin approval.', {
                        icon: '⏳',
                        duration: 4000,
                    });
                } else {
                    toast.success(`Updated status to ${newStatus.toUpperCase()} for ${dateKey}`);
                }
            }
        } catch (err: any) {
            // Revert on error
            setMonthlyAttendanceMap((prev) => ({
                ...prev,
                [currentKey]: currentStatus || 'present',
            }));
            toast.error(err.response?.data?.message || 'Failed to update attendance');
        }
    };

    // Cell Click Handler for Monthly Register Grid
    const handleMonthlyCellClick = async (studentId: number, dayNum: number) => {
        const dayStr = String(dayNum).padStart(2, '0');
        const dateKey = `${selectedMonth}-${dayStr}`;

        // Disallow future dates
        if (dateKey > todayStr) {
            toast.warning('Cannot mark attendance for future dates.');
            return;
        }

        // Check if holiday
        if (holidaysMap[dateKey] && !holidaysMap[dateKey].is_attendance_required) {
            toast.error(`Holiday: ${holidaysMap[dateKey].title} (${holidaysMap[dateKey].type})`);
            return;
        }

        const currentKey = `${studentId}_${dateKey}`;
        const currentStatus = monthlyAttendanceMap[currentKey] as 'present' | 'absent' | undefined;
        const newStatus: 'present' | 'absent' = currentStatus === 'present' ? 'absent' : 'present';

        // For past dates: open note dialog before submitting
        if (dateKey < todayStr) {
            // Optimistic update for immediate visual feedback
            setMonthlyAttendanceMap((prev) => ({ ...prev, [currentKey]: newStatus }));
            setPendingCellAction({ studentId, dateKey, currentKey, currentStatus, newStatus });
            setNoteDialogNote('');
            setNoteDialogOpen(true);
            return;
        }

        // Today → submit directly without note
        setMonthlyAttendanceMap((prev) => ({ ...prev, [currentKey]: newStatus }));
        await submitMonthlyCellUpdate(studentId, dateKey, currentKey, currentStatus, newStatus);
    };

    // Filtered Students List by Search
    const filteredDailyStudents = useMemo(() => {
        if (!searchQuery.trim()) return studentsList;
        const q = searchQuery.toLowerCase();
        return studentsList.filter(
            (s) =>
                s.first_name.toLowerCase().includes(q) ||
                s.last_name.toLowerCase().includes(q) ||
                (s.roll_number && s.roll_number.toString().toLowerCase().includes(q))
        );
    }, [studentsList, searchQuery]);

    const filteredMonthlyStudents = useMemo(() => {
        if (!searchQuery.trim()) return monthlyStudents;
        const q = searchQuery.toLowerCase();
        return monthlyStudents.filter(
            (s) =>
                s.first_name.toLowerCase().includes(q) ||
                s.last_name.toLowerCase().includes(q) ||
                (s.roll_number && s.roll_number.toString().toLowerCase().includes(q))
        );
    }, [monthlyStudents, searchQuery]);

    // Statistics Calculation for Daily Mode
    const dailyStats = useMemo(() => {
        const total = studentsList.length;
        let markedPresent = 0;
        let markedAbsent = 0;

        studentsList.forEach((s) => {
            const st = dailyStatusMap[s.student_id];
            if (st === 'present') markedPresent++;
            else if (st === 'absent') markedAbsent++;
        });

        const notMarked = total - (markedPresent + markedAbsent);
        const presentPct = total > 0 ? ((markedPresent / total) * 100).toFixed(0) : '0';

        return { total, present: markedPresent, absent: markedAbsent, notMarked, presentPct };
    }, [studentsList, dailyStatusMap]);

    // Date Navigator Helpers
    const shiftDailyDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const newDateStr = `${y}-${m}-${day}`;
        if (newDateStr <= todayStr) {
            setSelectedDate(newDateStr);
        } else {
            toast.warning('Cannot navigate into future dates.');
        }
    };

    const shiftMonthlyMonth = (months: number) => {
        const [yStr, mStr] = selectedMonth.split('-');
        let y = parseInt(yStr, 10);
        let m = parseInt(mStr, 10) + months;
        if (m > 12) {
            y += 1;
            m = 1;
        } else if (m < 1) {
            y -= 1;
            m = 12;
        }
        const newMonthStr = `${y}-${String(m).padStart(2, '0')}`;
        setSelectedMonth(newMonthStr);
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-50/50 space-y-6">
            {/* ── Top Header Section ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                                Attendance Register
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                View & mark student attendance for past days and the current day
                            </p>
                        </div>
                    </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'daily'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Daily Marking
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'monthly'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Grid className="w-4 h-4" />
                        Monthly Register Grid
                    </button>
                </div>
            </div>

            {/* ── Filters & Controls Bar ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-2xl border shadow-sm items-center">
                {/* Division Selector */}
                <div className="md:col-span-4 flex items-center gap-3">
                    <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="w-full">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            Class / Division
                        </label>
                        <select
                            value={selectedDivisionId}
                            onChange={(e) => setSelectedDivisionId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="all">All Assigned Divisions</option>
                            {classes.map((c) => (
                                <option key={c.division_id} value={c.division_id.toString()}>
                                    {c.class_name} - Division {c.division_name} ({c.student_count || 0} Students)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date / Month Picker Controls */}
                <div className="md:col-span-5 flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-slate-400 shrink-0" />
                    {viewMode === 'daily' ? (
                        <div className="w-full">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                Select Attendance Date
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => shiftDailyDate(-1)}
                                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                    title="Previous Day"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <input
                                    type="date"
                                    max={todayStr}
                                    value={selectedDate}
                                    onChange={(e) => {
                                        if (e.target.value <= todayStr) {
                                            setSelectedDate(e.target.value);
                                        } else {
                                            toast.warning('Future dates are not allowed.');
                                        }
                                    }}
                                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold flex-1 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                    onClick={() => shiftDailyDate(1)}
                                    disabled={selectedDate >= todayStr}
                                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition-colors"
                                    title="Next Day"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSelectedDate(todayStr)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                    Today
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                Select Month
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => shiftMonthlyMonth(-1)}
                                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                    title="Previous Month"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold flex-1 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                    onClick={() => shiftMonthlyMonth(1)}
                                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                    title="Next Month"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSelectedMonth(currentMonthStr)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                    Current Month
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Input */}
                <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Search Student
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name or roll no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
            </div>

            {/* ── DAILY MARKING VIEW ── */}
            {viewMode === 'daily' && (
                <div className="space-y-6">
                    {/* Summary Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border shadow-sm bg-white rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Students</p>
                                    <p className="text-2xl font-bold text-slate-800">{dailyStats.total}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Users className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm bg-white rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Present</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-bold text-emerald-600">{dailyStats.present}</p>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                            {dailyStats.presentPct}%
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm bg-white rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Absent</p>
                                    <p className="text-2xl font-bold text-rose-600">{dailyStats.absent}</p>
                                </div>
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                    <XCircle className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm bg-white rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unmarked</p>
                                    <p className="text-2xl font-bold text-amber-600">{dailyStats.notMarked}</p>
                                </div>
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions & Action Bar */}
                    <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Quick Actions:</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAll('present')}
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs rounded-xl"
                            >
                                <Check className="w-3.5 h-3.5 mr-1" /> Mark All Present
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAll('absent')}
                                className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold text-xs rounded-xl"
                            >
                                <X className="w-3.5 h-3.5 mr-1" /> Mark All Absent
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetAll}
                                className="text-slate-600 hover:bg-slate-100 font-medium text-xs rounded-xl"
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
                            </Button>
                        </div>

                        <Button
                            onClick={() => handleSaveDailyAttendance()}
                            disabled={isSavingDaily || isLoadingDaily}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-md transition-all flex items-center gap-2"
                        >
                            {isSavingDaily ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                                </>
                            ) : selectedDate < todayStr ? (
                                <>
                                    <AlertTriangle className="w-4 h-4" />
                                    Submit for Approval ({Object.keys(dailyStatusMap).length})
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save Attendance ({Object.keys(dailyStatusMap).length})
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Students Attendance Table */}
                    <Card className="border shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/70 border-b py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span>Student Roster for {selectedDate}</span>
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 font-semibold">
                                    {filteredDailyStudents.length} Students
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingDaily ? (
                                <div className="py-20 text-center">
                                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                                    <p className="text-slate-500 font-semibold text-sm">Loading student attendance roster...</p>
                                </div>
                            ) : filteredDailyStudents.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 space-y-2">
                                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-base">No students found</p>
                                    <p className="text-xs text-slate-400">Try changing the division filter or search query</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                <th className="py-3.5 px-6">Roll No</th>
                                                <th className="py-3.5 px-6">Student Name</th>
                                                <th className="py-3.5 px-6">Class & Division</th>
                                                <th className="py-3.5 px-6 text-center">Attendance Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-sm">
                                            {filteredDailyStudents.map((s) => {
                                                const status = dailyStatusMap[s.student_id];
                                                return (
                                                    <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-4 px-6 font-bold text-slate-700">
                                                            {s.roll_number || '-'}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="font-bold text-slate-800">
                                                                {s.first_name} {s.last_name}
                                                            </div>
                                                            {s.father_name && (
                                                                <div className="text-xs text-slate-400">
                                                                    Parent: {s.father_name}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                                {s.class_name || 'Class'} - Div {s.division_name || ''}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200">
                                                                <button
                                                                    onClick={() => handleToggleStudentStatus(s.student_id, 'present')}
                                                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'present'
                                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                                        : 'text-slate-600 hover:bg-slate-200/60'
                                                                        }`}
                                                                >
                                                                    <Check className="w-3.5 h-3.5" /> Present
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleStudentStatus(s.student_id, 'absent')}
                                                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'absent'
                                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                                        : 'text-slate-600 hover:bg-slate-200/60'
                                                                        }`}
                                                                >
                                                                    <X className="w-3.5 h-3.5" /> Absent
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── MONTHLY REGISTER GRID VIEW ── */}
            {viewMode === 'monthly' && (
                <Card className="border shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span>Monthly Attendance Sheet ({selectedMonth})</span>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    {daysInMonth} Days
                                </Badge>
                            </CardTitle>
                            <p className="text-xs text-slate-500 mt-1">
                                Click any cell to toggle <span className="font-bold text-emerald-600">P</span> (Present) or <span className="font-bold text-rose-600">A</span> (Absent) for past days or today.
                            </p>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-emerald-600 text-white rounded flex items-center justify-center font-bold text-[10px]">P</span>
                                <span className="text-slate-600">Present</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-rose-600 text-white rounded flex items-center justify-center font-bold text-[10px]">A</span>
                                <span className="text-slate-600">Absent</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-slate-200 text-slate-400 rounded flex items-center justify-center font-bold text-[10px]">-</span>
                                <span className="text-slate-600">Not Marked</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-amber-100 text-amber-800 rounded flex items-center justify-center font-bold text-[10px]">H</span>
                                <span className="text-slate-600">Holiday</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-yellow-200 text-yellow-800 rounded flex items-center justify-center font-bold text-[10px]">⏳</span>
                                <span className="text-slate-600">Pending Approval</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLoadingMonthly ? (
                            <div className="py-24 text-center">
                                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                                <p className="text-slate-500 font-semibold text-sm">Loading monthly register grid...</p>
                            </div>
                        ) : filteredMonthlyStudents.length === 0 ? (
                            <div className="py-16 text-center text-slate-500 space-y-2">
                                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                                <p className="font-semibold text-base">No students found</p>
                                <p className="text-xs text-slate-400">Try adjusting division filters or search input</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto max-w-full">
                                <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-100 border-b font-bold text-slate-700">
                                            <th className="py-3 px-3 sticky left-0 bg-slate-100 z-10 w-12 text-center border-r">
                                                Roll
                                            </th>
                                            <th className="py-3 px-4 sticky left-12 bg-slate-100 z-10 min-w-[160px] border-r">
                                                Student Name
                                            </th>
                                            {Array.from({ length: daysInMonth }, (_, i) => {
                                                const dayNum = i + 1;
                                                const dayStr = String(dayNum).padStart(2, '0');
                                                const dateKey = `${selectedMonth}-${dayStr}`;
                                                const isToday = dateKey === todayStr;
                                                const isFuture = dateKey > todayStr;
                                                const holiday = holidaysMap[dateKey];

                                                return (
                                                    <th
                                                        key={dayNum}
                                                        className={`py-2 px-1 text-center min-w-[34px] border-r ${isToday
                                                            ? 'bg-emerald-100 text-emerald-800 border-b-2 border-b-emerald-600'
                                                            : isFuture
                                                                ? 'bg-slate-50 text-slate-400'
                                                                : holiday
                                                                    ? 'bg-amber-50 text-amber-800'
                                                                    : ''
                                                            }`}
                                                        title={holiday ? `${holiday.title} (${holiday.type})` : dateKey}
                                                    >
                                                        <div>{dayNum}</div>
                                                    </th>
                                                );
                                            })}
                                            <th className="py-3 px-3 text-center bg-slate-100 font-bold min-w-[60px]">
                                                P / Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-medium text-slate-800">
                                        {filteredMonthlyStudents.map((s) => {
                                            let presentCount = 0;
                                            let totalMarkedDays = 0;

                                            return (
                                                <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-2.5 px-3 sticky left-0 bg-white hover:bg-slate-50 z-10 font-bold text-center border-r text-slate-700">
                                                        {s.roll_number || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-4 sticky left-12 bg-white hover:bg-slate-50 z-10 font-bold border-r truncate max-w-[180px]">
                                                        {s.first_name} {s.last_name}
                                                    </td>
                                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                                        const dayNum = i + 1;
                                                        const dayStr = String(dayNum).padStart(2, '0');
                                                        const dateKey = `${selectedMonth}-${dayStr}`;
                                                        const isToday = dateKey === todayStr;
                                                        const isFuture = dateKey > todayStr;
                                                        const holiday = holidaysMap[dateKey];
                                                        const recordKey = `${s.student_id}_${dateKey}`;
                                                        const status = monthlyAttendanceMap[recordKey];

                                                        if (status === 'present') {
                                                            presentCount++;
                                                            totalMarkedDays++;
                                                        } else if (status === 'absent') {
                                                            totalMarkedDays++;
                                                        }

                                                        return (
                                                            <td
                                                                key={dayNum}
                                                                onClick={() => handleMonthlyCellClick(s.student_id, dayNum)}
                                                                className={`py-2 px-1 text-center border-r select-none cursor-pointer transition-colors ${isToday ? 'bg-emerald-50/50' : ''
                                                                    } ${isFuture ? 'bg-slate-50/60 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                                                            >
                                                                {holiday && !holiday.is_attendance_required ? (
                                                                    <span
                                                                        className="inline-block w-6 h-6 leading-6 rounded bg-amber-100 text-amber-800 font-bold text-[10px]"
                                                                        title={holiday.title}
                                                                    >
                                                                        H
                                                                    </span>
                                                                ) : pendingRequestsMap[recordKey] ? (
                                                                    <span
                                                                        className="inline-block w-6 h-6 leading-6 rounded bg-yellow-200 text-yellow-800 font-bold text-[10px]"
                                                                        title="Pending approval by School Admin"
                                                                    >
                                                                        ⏳
                                                                    </span>
                                                                ) : status === 'present' ? (
                                                                    <span className="inline-block w-6 h-6 leading-6 rounded bg-emerald-600 text-white font-bold text-[11px] shadow-xs">
                                                                        P
                                                                    </span>
                                                                ) : status === 'absent' ? (
                                                                    <span className="inline-block w-6 h-6 leading-6 rounded bg-rose-600 text-white font-bold text-[11px] shadow-xs">
                                                                        A
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-block w-6 h-6 leading-6 rounded text-slate-300 font-bold text-[11px]">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-2.5 px-3 text-center bg-slate-50/80 font-bold text-slate-700">
                                                        {presentCount} / {totalMarkedDays}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Monthly Cell Note Dialog (past-date edit) ── */}
            {noteDialogOpen && pendingCellAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Reason for Edit</h3>
                                <p className="text-xs text-slate-500">
                                    Editing past attendance for{' '}
                                    <span className="font-semibold text-slate-700">{pendingCellAction.dateKey}</span>{' '}
                                    requires admin approval.
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
                            <p>
                                <span className="font-semibold">Change:</span>{' '}
                                <span className={`font-bold ${pendingCellAction.currentStatus === 'present' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {pendingCellAction.currentStatus ? pendingCellAction.currentStatus.toUpperCase() : 'NOT MARKED'}
                                </span>
                                {' → '}
                                <span className={`font-bold ${pendingCellAction.newStatus === 'present' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {pendingCellAction.newStatus.toUpperCase()}
                                </span>
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                Note / Reason <span className="text-slate-400 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                                rows={3}
                                placeholder="e.g. Student was confirmed absent by parent call..."
                                value={noteDialogNote}
                                onChange={(e) => setNoteDialogNote(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => {
                                    const { currentKey, currentStatus } = pendingCellAction;
                                    setMonthlyAttendanceMap((prev) => ({
                                        ...prev,
                                        [currentKey]: currentStatus as 'present' | 'absent',
                                    }));
                                    setNoteDialogOpen(false);
                                    setPendingCellAction(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                onClick={() => {
                                    const { studentId, dateKey, currentKey, currentStatus, newStatus } = pendingCellAction!;
                                    setNoteDialogOpen(false);
                                    setPendingCellAction(null);
                                    submitMonthlyCellUpdate(studentId, dateKey, currentKey, currentStatus, newStatus, noteDialogNote.trim() || undefined);
                                }}
                            >
                                Submit Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Daily Bulk Submit Note Dialog (past date) ── */}
            {dailyNoteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Reason for Past-Date Edit</h3>
                                <p className="text-xs text-slate-500">
                                    Submitting attendance for{' '}
                                    <span className="font-semibold text-slate-700">{selectedDate}</span>{' '}
                                    requires School Admin approval.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                Note / Reason <span className="text-slate-400 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                                rows={3}
                                placeholder="e.g. Attendance was missed due to system outage..."
                                value={dailyNoteNote}
                                onChange={(e) => setDailyNoteNote(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => setDailyNoteDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                onClick={() => {
                                    setDailyNoteDialogOpen(false);
                                    handleSaveDailyAttendance(dailyNoteNote.trim() || '');
                                }}
                            >
                                Submit for Approval
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}






export default AttendanceRegister;
