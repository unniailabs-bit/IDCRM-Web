import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    CalendarDays,
    Users,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCw,
    BookOpen,
    AlertCircle,
    MessageSquare,
    X,
    Check,
    AlertTriangle,
    Grid,
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

// ── Edit Cell Modal State ────────────────────────────────────────────────────
interface EditModalState {
    isOpen: boolean;
    studentId: number | null;
    studentName: string;
    dateKey: string;          // YYYY-MM-DD
    currentStatus: 'present' | 'absent' | undefined;
    selectedStatus: 'present' | 'absent';
    note: string;
    isPast: boolean;
}

interface BulkAttendanceModalState {
    isOpen: boolean;
    dateKey: string;
    attendanceMap: Record<number, 'present' | 'absent'>;
    note: string;
}

const EMPTY_EDIT_MODAL: EditModalState = {
    isOpen: false,
    studentId: null,
    studentName: '',
    dateKey: '',
    currentStatus: undefined,
    selectedStatus: 'present',
    note: '',
    isPast: false,
};

const EMPTY_BULK_MODAL: BulkAttendanceModalState = {
    isOpen: false,
    dateKey: '',
    attendanceMap: {},
    note: '',
};

// Day name helper
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function getDayName(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00');
    return DAY_NAMES[d.getDay()];
}
function formatDateFull(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function AttendanceRegister() {
    const token = localStorage.getItem('token');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
    const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

    // Selected month for the monthly view
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

    // Monthly Data
    const [monthlyStudents, setMonthlyStudents] = useState<StudentRecord[]>([]);
    const [monthlyAttendanceMap, setMonthlyAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
    const [holidaysMap, setHolidaysMap] = useState<Record<string, HolidayEntry>>({});
    const [daysInMonth, setDaysInMonth] = useState<number>(31);
    const [isLoadingMonthly, setIsLoadingMonthly] = useState<boolean>(false);

    // Pending and rejected edit requests: key = "studentId_YYYY-MM-DD" -> status
    const [pendingRequestsMap, setPendingRequestsMap] = useState<Record<string, boolean>>({});
    const [rejectedRequestsMap, setRejectedRequestsMap] = useState<Record<string, boolean>>({});

    // Search filter
    const [searchQuery, setSearchQuery] = useState<string>('');

    // ── Edit Cell Modal ──────────────────────────────────────────────────────
    const [editModal, setEditModal] = useState<EditModalState>(EMPTY_EDIT_MODAL);
    const [bulkAttendanceModal, setBulkAttendanceModal] = useState<BulkAttendanceModalState>(EMPTY_BULK_MODAL);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Record<number, boolean>>({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isSavingBulkAttendance, setIsSavingBulkAttendance] = useState(false);

    // ── 1. Fetch assigned teacher classes on mount ───────────────────────────
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/teacher/attendance/classes`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success && Array.isArray(res.data.data)) {
                    setClasses(res.data.data);
                    if (res.data.data.length > 0) {
                        setSelectedDivisionId(res.data.data[0].division_id.toString());
                    }
                }
            } catch (err) {
                console.error('Failed to fetch classes:', err);
            }
        };
        fetchClasses();
    }, [BACKEND_URL, token]);

    // ── 2. Fetch Monthly Register Data ───────────────────────────────────────
    const fetchMonthlyData = async () => {
        if (!selectedMonth) return;
        setIsLoadingMonthly(true);
        try {
            const divisionParam = selectedDivisionId !== 'all' ? `&division_id=${selectedDivisionId}` : '';
            const res = await axios.get(
                `${BACKEND_URL}/api/teacher/attendance/register?month=${selectedMonth}${divisionParam}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
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

    // ── 3. Fetch attendance edit request statuses ──────────────────────────
    const fetchAttendanceRequestStatuses = async () => {
        try {
            const divisionParam = selectedDivisionId !== 'all' ? `&division_id=${selectedDivisionId}` : '';
            const res = await axios.get(
                `${BACKEND_URL}/api/teacher/attendance/edit-requests?month=${selectedMonth}${divisionParam}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                const pendingMap: Record<string, boolean> = {};
                const rejectedMap: Record<string, boolean> = {};

                (res.data.data || []).forEach((r: any) => {
                    const key = `${r.student_id}_${r.attendance_date}`;
                    if (r.status === 'pending') pendingMap[key] = true;
                    else if (r.status === 'rejected') rejectedMap[key] = true;
                });

                setPendingRequestsMap(pendingMap);
                setRejectedRequestsMap(rejectedMap);
            }
        } catch {
            // silently ignore
        }
    };

    // Trigger data load when filters/month change
    useEffect(() => {
        fetchMonthlyData();
        fetchAttendanceRequestStatuses();
    }, [selectedMonth, selectedDivisionId]);

    useEffect(() => {
        const handleCalendarRefresh = () => fetchMonthlyData();
        window.addEventListener('calendarDataChanged', handleCalendarRefresh);

        return () => {
            window.removeEventListener('calendarDataChanged', handleCalendarRefresh);
        };
    }, []);

    // ── Filtered Students ────────────────────────────────────────────────────
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

    // ── Month navigation ─────────────────────────────────────────────────────
    const shiftMonth = (months: number) => {
        const [yStr, mStr] = selectedMonth.split('-');
        let y = parseInt(yStr, 10);
        let m = parseInt(mStr, 10) + months;
        if (m > 12) { y += 1; m = 1; }
        else if (m < 1) { y -= 1; m = 12; }
        setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    };

    // ── Cell click → open modal ──────────────────────────────────────────────
    const isHolidayClosed = (dateKey: string) => holidaysMap[dateKey]?.is_attendance_required === false;

    const handleCellClick = (student: StudentRecord, dayNum: number) => {
        const dayStr = String(dayNum).padStart(2, '0');
        const dateKey = `${selectedMonth}-${dayStr}`;

        if (dateKey > todayStr) {
            toast.warning('Cannot mark attendance for future dates.');
            return;
        }
        if (isHolidayClosed(dateKey)) {
            toast.error(`Holiday: ${holidaysMap[dateKey].title} (${holidaysMap[dateKey].type})`);
            return;
        }

        const recordKey = `${student.student_id}_${dateKey}`;
        const currentStatus = monthlyAttendanceMap[recordKey] as 'present' | 'absent' | undefined;
        const isPast = dateKey < todayStr;

        setEditModal({
            isOpen: true,
            studentId: student.student_id,
            studentName: `${student.first_name} ${student.last_name}`,
            dateKey,
            currentStatus,
            selectedStatus: currentStatus === 'absent' ? 'absent' : 'present',
            note: '',
            isPast,
        });
    };

    const openBulkAttendanceModal = (dateKey: string) => {
        if (isHolidayClosed(dateKey)) {
            toast.error(`Holiday: ${holidaysMap[dateKey].title} (${holidaysMap[dateKey].type})`);
            return;
        }

        const attendanceMap: Record<number, 'present' | 'absent'> = {};

        filteredMonthlyStudents.forEach((student) => {
            const status = monthlyAttendanceMap[`${student.student_id}_${dateKey}`];
            if (status === 'present' || status === 'absent') {
                attendanceMap[student.student_id] = status;
            }
        });

        setBulkAttendanceModal({ isOpen: true, dateKey, attendanceMap, note: '' });
    };

    const updateBulkAttendanceStatus = (studentId: number, status: 'present' | 'absent') => {
        setBulkAttendanceModal((prev) => ({
            ...prev,
            attendanceMap: { ...prev.attendanceMap, [studentId]: status },
        }));
    };

    const toggleStudentSelection = (studentId: number) => {
        setSelectedStudentIds((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    const toggleAllStudents = () => {
        const allSelected = filteredMonthlyStudents.length > 0 && filteredMonthlyStudents.every((student) => selectedStudentIds[student.student_id]);
        if (allSelected) {
            const nextSelection = { ...selectedStudentIds };
            filteredMonthlyStudents.forEach((student) => { delete nextSelection[student.student_id]; });
            setSelectedStudentIds(nextSelection);
            return;
        }

        setSelectedStudentIds((prev) => ({
            ...prev,
            ...Object.fromEntries(filteredMonthlyStudents.map((student) => [student.student_id, true])),
        }));
    };

    // ── Submit edit ──────────────────────────────────────────────────────────
    const handleSubmitEdit = async () => {
        if (!editModal.studentId) return;
        setIsSavingEdit(true);

        const { dateKey, selectedStatus, note, isPast } = editModal;
        const noteVal = note.trim() || undefined;

        // Build list of students to update
        const studentsToUpdate = monthlyStudents.filter((s) => s.student_id === editModal.studentId);

        let anyPendingApproval = false;
        let anyError = false;

        for (const student of studentsToUpdate) {
            const recordKey = `${student.student_id}_${dateKey}`;
            const prevStatus = monthlyAttendanceMap[recordKey];
            if (prevStatus === selectedStatus) continue;   // no change needed

            // Optimistic update
            setMonthlyAttendanceMap((prev) => ({ ...prev, [recordKey]: selectedStatus }));

            try {
                const res = await axios.patch(
                    `${BACKEND_URL}/api/teacher/attendance/update`,
                    { student_id: student.student_id, date: dateKey, status: selectedStatus, note: noteVal },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    if (res.data.pending_approval) {
                        // Revert to original — it's now pending
                        setMonthlyAttendanceMap((prev) => ({
                            ...prev,
                            [recordKey]: prevStatus as 'present' | 'absent',
                        }));
                        setPendingRequestsMap((prev) => ({ ...prev, [recordKey]: true }));
                        anyPendingApproval = true;
                    }
                }
            } catch (err: any) {
                // Revert on error
                setMonthlyAttendanceMap((prev) => ({
                    ...prev,
                    [recordKey]: prevStatus || 'present',
                }));
                anyError = true;
            }
        }

        setIsSavingEdit(false);
        setEditModal(EMPTY_EDIT_MODAL);

        if (anyError) {
            toast.error('Some updates failed. Please retry.');
        } else if (anyPendingApproval) {
            toast.info('Edit request submitted — awaiting School Admin approval.', { icon: '⏳', duration: 4000 });
        } else {
            toast.success(`Updated ${editModal.studentName} to ${selectedStatus.toUpperCase()}`);
        }
    };

    const handleSubmitBulkAttendance = async () => {
        if (!bulkAttendanceModal.dateKey) return;
        if (bulkAttendanceModal.dateKey > todayStr) {
            toast.warning('Cannot mark attendance for a future date.');
            return;
        }
        if (isHolidayClosed(bulkAttendanceModal.dateKey)) {
            toast.error(`Holiday: ${holidaysMap[bulkAttendanceModal.dateKey].title} (${holidaysMap[bulkAttendanceModal.dateKey].type})`);
            return;
        }

        const isPastDate = bulkAttendanceModal.dateKey < todayStr;
        const selectedStudents = filteredMonthlyStudents.filter((student) => selectedStudentIds[student.student_id]);
        const attendance = selectedStudents
            .map((student) => {
                const status = bulkAttendanceModal.attendanceMap[student.student_id];
                return status ? { student_id: student.student_id, status } : null;
            })
            .filter((item): item is { student_id: number; status: 'present' | 'absent' } => item !== null);

        if (attendance.length === 0) {
            toast.warning('Select present or absent for at least one selected student.');
            return;
        }

        setIsSavingBulkAttendance(true);
        try {
            const response = await axios.post(
                `${BACKEND_URL}/api/teacher/attendance/mark`,
                { date: bulkAttendanceModal.dateKey, attendance, note: bulkAttendanceModal.note.trim() || undefined },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                if (response.data.pending_approval) {
                    const nextPendingRequests = { ...pendingRequestsMap };
                    attendance.forEach(({ student_id }) => {
                        nextPendingRequests[`${student_id}_${bulkAttendanceModal.dateKey}`] = true;
                    });
                    setPendingRequestsMap(nextPendingRequests);
                    toast.info(`Bulk attendance submitted for School Admin approval for ${formatDateFull(bulkAttendanceModal.dateKey)}.`, { icon: '⏳', duration: 4000 });
                } else {
                    setMonthlyAttendanceMap((prev) => ({
                        ...prev,
                        ...Object.fromEntries(attendance.map(({ student_id, status }) => [`${student_id}_${bulkAttendanceModal.dateKey}`, status])),
                    }));
                    toast.success(`Updated ${attendance.length} students for ${formatDateFull(bulkAttendanceModal.dateKey)}`);
                }
                setBulkAttendanceModal(EMPTY_BULK_MODAL);
            } else {
                toast.error(response.data.message || 'Bulk attendance update failed.');
            }
        } catch (error: any) {
            console.error('Failed to save bulk attendance:', error);
            toast.error(error.response?.data?.message || 'Bulk attendance update failed.');
        } finally {
            setIsSavingBulkAttendance(false);
        }
    };

    // ── Monthly Statistics ───────────────────────────────────────────────────
    const monthlyStats = useMemo(() => {
        let totalMarked = 0;
        let totalPresent = 0;
        monthlyStudents.forEach((s) => {
            Array.from({ length: daysInMonth }, (_, i) => {
                const dayStr = String(i + 1).padStart(2, '0');
                const dateKey = `${selectedMonth}-${dayStr}`;
                if (dateKey > todayStr) return;
                const key = `${s.student_id}_${dateKey}`;
                const st = monthlyAttendanceMap[key];
                if (st === 'present') { totalMarked++; totalPresent++; }
                else if (st === 'absent') { totalMarked++; }
            });
        });
        const pct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
        return { totalStudents: monthlyStudents.length, totalMarked, totalPresent, pct };
    }, [monthlyStudents, monthlyAttendanceMap, daysInMonth, selectedMonth, todayStr]);

    // ────────────────────────────────────────────────────────────────────────
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
                                Monthly grid view — click any cell to edit past attendance
                            </p>
                        </div>
                    </div>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => shiftMonth(-1)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Previous Month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                        onClick={() => shiftMonth(1)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Next Month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setSelectedMonth(currentMonthStr)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap"
                    >
                        Current Month
                    </button>
                </div>
            </div>

            {/* ── Filters Bar ── */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border shadow-sm md:flex-row md:items-end">
                {/* Division Selector */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="w-full min-w-0">
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

                {/* Search */}
                <div className="min-w-0 flex-1">
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

                {/* Refresh */}
                <div className="flex md:justify-end">
                    <button
                        onClick={() => { fetchMonthlyData(); fetchAttendanceRequestStatuses(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border shadow-sm bg-white rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Students</p>
                            <p className="text-2xl font-bold text-slate-800">{monthlyStats.totalStudents}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-white rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Present (Total)</p>
                            <p className="text-2xl font-bold text-emerald-600">{monthlyStats.totalPresent}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-white rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Absent (Total)</p>
                            <p className="text-2xl font-bold text-rose-600">
                                {monthlyStats.totalMarked - monthlyStats.totalPresent}
                            </p>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <XCircle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm bg-white rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attendance %</p>
                            <p className="text-2xl font-bold text-violet-600">{monthlyStats.pct}%</p>
                        </div>
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                            <Grid className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Monthly Register Grid ── */}
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
                            Click any past/today cell to edit attendance, or use bulk attendance to update the full register.
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center flex-wrap gap-3 text-xs font-semibold">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => openBulkAttendanceModal(todayStr)}
                            disabled={Object.keys(selectedStudentIds).filter((id) => selectedStudentIds[Number(id)]).length === 0}
                        >
                            <Grid className="w-4 h-4 mr-2" />
                            Bulk Attendance
                        </Button>
                        {[
                            { label: 'Present', abbr: 'P', cls: 'bg-emerald-600 text-white' },
                            { label: 'Absent', abbr: 'A', cls: 'bg-rose-600 text-white' },
                            { label: 'Not Marked', abbr: '-', cls: 'bg-slate-200 text-slate-400' },
                            { label: 'Holiday', abbr: 'H', cls: 'bg-amber-100 text-amber-800' },
                            { label: 'Pending', abbr: '⏳', cls: 'bg-yellow-200 text-yellow-800' },
                            { label: 'Rejected', abbr: 'R', cls: 'bg-rose-200 text-rose-800' },
                        ].map(({ label, abbr, cls }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 ${cls} rounded flex items-center justify-center font-bold text-[10px]`}>{abbr}</span>
                                <span className="text-slate-600">{label}</span>
                            </div>
                        ))}
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
                                            <input
                                                type="checkbox"
                                                aria-label="Select all students"
                                                checked={filteredMonthlyStudents.length > 0 && filteredMonthlyStudents.every((student) => selectedStudentIds[student.student_id])}
                                                onChange={toggleAllStudents}
                                                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                            />
                                        </th>
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
                                            const dayName = getDayName(dateKey);

                                            return (
                                                <th
                                                    key={dayNum}
                                                    className={`relative py-2 px-1 text-center min-w-[36px] border-r ${isToday
                                                        ? 'bg-emerald-100 text-emerald-800 border-b-2 border-b-emerald-600'
                                                        : isFuture
                                                            ? 'bg-slate-50 text-slate-400'
                                                            : holiday && !holiday.is_attendance_required
                                                                ? 'bg-amber-50 text-amber-800'
                                                                : ''
                                                        }`}
                                                    title={holiday ? `${holiday.title} (${holiday.type})` : dateKey}
                                                >
                                                    <div className="relative inline-flex items-center justify-center font-bold">
                                                        {dayNum}
                                                        {holiday && !holiday.is_attendance_required && (
                                                            <span
                                                                className="absolute -top-0.5 -right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white shadow-sm"
                                                                aria-label={`${holiday.title} holiday`}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className={`text-[9px] font-medium ${dayName === 'Sun' || dayName === 'Sat' ? 'text-rose-400' : 'text-slate-400'}`}>
                                                        {dayName}
                                                    </div>
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
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${s.first_name} ${s.last_name}`}
                                                        checked={Boolean(selectedStudentIds[s.student_id])}
                                                        onChange={() => toggleStudentSelection(s.student_id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-3 sticky left-12 bg-white hover:bg-slate-50 z-10 font-bold text-center border-r text-slate-700">
                                                    {s.roll_number || '-'}
                                                </td>
                                                <td className="py-2.5 px-4 sticky left-24 bg-white hover:bg-slate-50 z-10 font-bold border-r truncate max-w-[180px]">
                                                    {s.first_name} {s.last_name}
                                                </td>
                                                {Array.from({ length: daysInMonth }, (_, i) => {
                                                    const dayNum = i + 1;
                                                    const dayStr = String(dayNum).padStart(2, '0');
                                                    const dateKey = `${selectedMonth}-${dayStr}`;
                                                    const isToday = dateKey === todayStr;
                                                    const isFuture = dateKey > todayStr;
                                                    const holiday = holidaysMap[dateKey];
                                                    const isClosedHoliday = isHolidayClosed(dateKey);
                                                    const recordKey = `${s.student_id}_${dateKey}`;
                                                    const status = monthlyAttendanceMap[recordKey];

                                                    if (status === 'present') { presentCount++; totalMarkedDays++; }
                                                    else if (status === 'absent') { totalMarkedDays++; }

                                                    return (
                                                        <td
                                                            key={dayNum}
                                                            onClick={() => !isFuture && !isClosedHoliday && handleCellClick(s, dayNum)}
                                                            className={`relative py-2 px-1 text-center border-r select-none transition-colors ${isToday ? 'bg-emerald-50/50' : ''
                                                                } ${isFuture
                                                                    ? 'bg-slate-50/60 cursor-not-allowed opacity-50'
                                                                    : isClosedHoliday
                                                                        ? 'bg-amber-50 cursor-not-allowed'
                                                                        : 'cursor-pointer hover:bg-violet-50 hover:ring-1 hover:ring-violet-200'
                                                                }`}
                                                            title={isFuture ? 'Future date' : isClosedHoliday ? `Closed holiday • ${dateKey}` : `Click to edit • ${dateKey}`}
                                                        >
                                                            {holiday && !holiday.is_attendance_required ? (
                                                                <span
                                                                    className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-1 ring-white"
                                                                    title={holiday.title}
                                                                    aria-label={`${holiday.title} holiday`}
                                                                />
                                                            ) : pendingRequestsMap[recordKey] ? (
                                                                <span
                                                                    className="inline-block w-6 h-6 leading-6 rounded bg-yellow-200 text-yellow-800 font-bold text-[10px]"
                                                                    title="Pending approval by School Admin"
                                                                >
                                                                    ⏳
                                                                </span>
                                                            ) : rejectedRequestsMap[recordKey] ? (
                                                                <span
                                                                    className="inline-block w-6 h-6 leading-6 rounded bg-rose-200 text-rose-800 font-bold text-[10px]"
                                                                    title="Rejected by School Admin"
                                                                >
                                                                    R
                                                                </span>
                                                            ) : status === 'present' ? (
                                                                <span className="inline-block w-6 h-6 leading-6 rounded bg-emerald-600 text-white font-bold text-[11px]">
                                                                    P
                                                                </span>
                                                            ) : status === 'absent' ? (
                                                                <span className="inline-block w-6 h-6 leading-6 rounded bg-rose-600 text-white font-bold text-[11px]">
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

            {/* ══════════════════════════════════════════════════════════════════
                Bulk Attendance Modal
                ══════════════════════════════════════════════════════════════════ */}
            {bulkAttendanceModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-indigo-600 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-white">Bulk Attendance</h3>
                                <p className="text-xs text-white/70">Update selected students for one date</p>
                            </div>
                            <button
                                onClick={() => setBulkAttendanceModal(EMPTY_BULK_MODAL)}
                                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b bg-slate-50 space-y-3 shrink-0">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Date
                                <input
                                    type="date"
                                    value={bulkAttendanceModal.dateKey}
                                    min={`${selectedMonth}-01`}
                                    max={`${selectedMonth}-${String(daysInMonth).padStart(2, '0')}`}
                                    onChange={(event) => setBulkAttendanceModal((prev) => ({ ...prev, dateKey: event.target.value }))}
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                />
                            </label>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {bulkAttendanceModal.dateKey ? `${formatDateFull(bulkAttendanceModal.dateKey)} • ${getDayName(bulkAttendanceModal.dateKey)}` : 'Select a date'}
                            </p>
                        </div>

                        <div className="overflow-auto min-h-0">
                            <table className="w-full border-collapse text-xs">
                                <thead className="sticky top-0 z-10 bg-slate-100">
                                    <tr>
                                        <th className="sticky left-0 z-20 bg-slate-100 border-b border-r p-3 text-left min-w-[200px] text-slate-700">
                                            Student Name
                                        </th>
                                        <th className="border-b p-3 text-center min-w-[180px] text-slate-700">
                                            Attendance Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMonthlyStudents.filter((student) => selectedStudentIds[student.student_id]).map((student) => {
                                        const status = bulkAttendanceModal.attendanceMap[student.student_id];
                                        return (
                                            <tr key={student.student_id} className="border-b hover:bg-slate-50/80">
                                                <td className="sticky left-0 z-10 bg-white border-r p-3 font-bold text-slate-700">
                                                    {student.first_name} {student.last_name}
                                                    <div className="text-[10px] font-medium text-slate-400">Roll {student.roll_number || '-'}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateBulkAttendanceStatus(student.student_id, 'present')}
                                                            className={`flex-1 min-w-[90px] rounded-xl py-2.5 text-xs font-bold transition-colors ${status === 'present'
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateBulkAttendanceStatus(student.student_id, 'absent')}
                                                            className={`flex-1 min-w-[90px] rounded-xl py-2.5 text-xs font-bold transition-colors ${status === 'absent'
                                                                ? 'bg-rose-600 text-white'
                                                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t bg-slate-50">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Note / Reason
                                <textarea
                                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                    rows={2}
                                    placeholder="Optional reason for past-date approval"
                                    value={bulkAttendanceModal.note}
                                    onChange={(event) => setBulkAttendanceModal((prev) => ({ ...prev, note: event.target.value }))}
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-slate-50">
                            <p className="text-xs text-slate-500">
                                {filteredMonthlyStudents.filter((student) => selectedStudentIds[student.student_id]).length} selected student(s).
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => setBulkAttendanceModal(EMPTY_BULK_MODAL)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitBulkAttendance}
                                    disabled={isSavingBulkAttendance}
                                    className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                    {isSavingBulkAttendance ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                                    ) : bulkAttendanceModal.dateKey < todayStr ? (
                                        <><AlertTriangle className="w-4 h-4 mr-2" /> Submit for Approval</>
                                    ) : (
                                        <><Check className="w-4 h-4 mr-2" /> Save Bulk Attendance</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                Edit Attendance Modal
                ══════════════════════════════════════════════════════════════════ */}
            {editModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-indigo-600">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <CalendarDays className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Edit Attendance</h3>
                                    <p className="text-xs text-white/70">Modify past attendance record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModal(EMPTY_EDIT_MODAL)}
                                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Bulk Attendance option */}
                            {/* Date + Student Info Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Date Card */}
                                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-sm font-bold text-violet-800 leading-tight">
                                        {formatDateFull(editModal.dateKey)}
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getDayName(editModal.dateKey) === 'Sun' || getDayName(editModal.dateKey) === 'Sat'
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {getDayName(editModal.dateKey)}
                                        </span>
                                        {editModal.isPast && (
                                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                Past Date
                                            </span>
                                        )}
                                        {!editModal.isPast && (
                                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                                Today
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Student Card */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Student</p>
                                    <p className="text-sm font-bold text-indigo-800 leading-tight truncate">
                                        {editModal.studentName}
                                    </p>
                                    {editModal.currentStatus && (
                                        <div className="mt-1.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${editModal.currentStatus === 'present'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                Currently: {editModal.currentStatus.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {!editModal.currentStatus && (
                                        <div className="mt-1.5">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                Not Marked Yet
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Present / Absent Toggle */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Mark As
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditModal((prev) => ({ ...prev, selectedStatus: 'present' }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${editModal.selectedStatus === 'present'
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                                            }`}
                                    >
                                        <Check className="w-4 h-4" />
                                        Present
                                    </button>
                                    <button
                                        onClick={() => setEditModal((prev) => ({ ...prev, selectedStatus: 'absent' }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${editModal.selectedStatus === 'absent'
                                            ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50'
                                            }`}
                                    >
                                        <X className="w-4 h-4" />
                                        Absent
                                    </button>
                                </div>
                            </div>

                            {/* Note / Reason (for past dates) */}
                            {editModal.isPast && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Note / Reason
                                        {editModal.isPast && (
                                            <span className="text-amber-500 font-normal normal-case text-[10px] bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                Required for admin approval
                                            </span>
                                        )}
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                                        rows={2}
                                        placeholder="e.g. Student was confirmed absent by parent call..."
                                        value={editModal.note}
                                        onChange={(e) => setEditModal((prev) => ({ ...prev, note: e.target.value }))}
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Past-date warning */}
                            {editModal.isPast && (
                                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 font-medium">
                                        Past-date edits require <span className="font-bold">School Admin approval</span>. Your request will be submitted and the cell will show a pending indicator until approved.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center gap-3 px-6 pb-6">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => setEditModal(EMPTY_EDIT_MODAL)}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isSavingEdit}
                                onClick={handleSubmitEdit}
                                className={`flex-1 rounded-xl font-bold transition-all ${editModal.isPast
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                            >
                                {isSavingEdit ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                                ) : editModal.isPast ? (
                                    <><AlertTriangle className="w-4 h-4 mr-2" /> Submit for Approval</>
                                ) : (
                                    <><Check className="w-4 h-4 mr-2" /> Save Attendance</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AttendanceRegister;
