import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Users,
    AlertCircle,
    CheckCheck,
    X,
    MessageSquare,
    ClipboardList,
    ArrowRight,
    Building2,
    Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '../../ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { classService } from '@/api/classService';

interface EditRequest {
    id: number;
    teacher_id: number;
    student_id: number;
    first_name: string;
    last_name: string;
    roll_number: string;
    division_id: number;
    division_name: string;
    class_id?: number;
    class_name: string;
    attendance_date: string;
    current_status: 'present' | 'absent' | null;
    requested_status: 'present' | 'absent';
    status: 'pending' | 'approved' | 'rejected';
    teacher_note: string | null;
    admin_note: string | null;
    reviewed_at: string | null;
    created_at: string;
    teacher_name: string | null;
    teacher_email: string | null;
}

interface Summary {
    pending: string;
    approved: string;
    rejected: string;
}

const STATUS_COLORS: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    absent: 'bg-rose-100 text-rose-800 border-rose-200',
    null: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    null: 'Not Marked',
};

export function AttendanceEditRequests() {
    const token = localStorage.getItem('token');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const { userData } = useAuth();

    const [requests, setRequests] = useState<EditRequest[]>([]);
    const [summary, setSummary] = useState<Summary>({ pending: '0', approved: '0', rejected: '0' });
    const [isLoading, setIsLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterDivision, setFilterDivision] = useState<string>('all');
    const [filterMonth, setFilterMonth] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [schoolClasses, setSchoolClasses] = useState<Array<{ id: number; class_name: string }>>([]);

    // Review dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
    const [dialogTarget, setDialogTarget] = useState<EditRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk action dialog
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);

    const today = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    // Fetch school classes list for class-wise tabs & dropdown
    useEffect(() => {
        const fetchClasses = async () => {
            const schoolId = userData?.school_id || userData?.id;
            if (!schoolId) return;
            try {
                const res = await classService.getClassesBySchool(schoolId);
                if (res?.success && Array.isArray(res?.data)) {
                    setSchoolClasses(res.data);
                }
            } catch (e) {
                console.error('Failed to load school classes', e);
            }
        };
        fetchClasses();
    }, [userData]);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        setSelectedIds(new Set());
        try {
            const params: Record<string, string> = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterMonth) params.month = filterMonth;
            if (filterClass !== 'all') params.class_id = filterClass;
            if (filterDivision !== 'all') params.division_id = filterDivision;

            const res = await axios.get(`${BACKEND_URL}/api/school/attendance-edit-requests`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            if (res.data.success) {
                setRequests(res.data.data || []);
                setSummary(res.data.summary || { pending: '0', approved: '0', rejected: '0' });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load attendance edit requests');
        } finally {
            setIsLoading(false);
        }
    }, [BACKEND_URL, token, filterStatus, filterMonth, filterClass, filterDivision]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    /* ── Class list for tabs & dropdown ── */
    const classList = useMemo(() => {
        const map = new Map<string, { id: number | string; class_name: string }>();

        schoolClasses.forEach((c) => {
            if (c.class_name) {
                map.set(String(c.id || c.class_name), { id: c.id, class_name: c.class_name });
            }
        });

        requests.forEach((r) => {
            if (r.class_name) {
                const key = String(r.class_id || r.class_name);
                if (!map.has(key)) {
                    map.set(key, { id: r.class_id || r.class_name, class_name: r.class_name });
                }
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            a.class_name.localeCompare(b.class_name, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [schoolClasses, requests]);

    /* ── Division list for filter ── */
    const divisionList = useMemo(() => {
        const map = new Map<string, { id: number | string; division_name: string }>();

        requests.forEach((r) => {
            if (filterClass !== 'all') {
                const matchesClass = String(r.class_id) === String(filterClass) || r.class_name === filterClass;
                if (!matchesClass) return;
            }

            if (r.division_name) {
                const key = String(r.division_id || r.division_name);
                if (!map.has(key)) {
                    map.set(key, { id: r.division_id || r.division_name, division_name: r.division_name });
                }
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            a.division_name.localeCompare(b.division_name, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [requests, filterClass]);

    /* ── Filtered list ── */
    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            if (filterClass !== 'all') {
                const matchesClass = String(r.class_id) === String(filterClass) || r.class_name === filterClass;
                if (!matchesClass) return false;
            }

            if (filterDivision !== 'all') {
                const matchesDivision = String(r.division_id) === String(filterDivision) || r.division_name === filterDivision;
                if (!matchesDivision) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesSearch =
                    r.first_name.toLowerCase().includes(q) ||
                    r.last_name.toLowerCase().includes(q) ||
                    (r.roll_number && r.roll_number.toLowerCase().includes(q)) ||
                    (r.teacher_name && r.teacher_name.toLowerCase().includes(q)) ||
                    (r.class_name && r.class_name.toLowerCase().includes(q)) ||
                    (r.division_name && r.division_name.toLowerCase().includes(q));
                if (!matchesSearch) return false;
            }

            return true;
        });
    }, [requests, filterClass, filterDivision, searchQuery]);

    /* ── Single actions ── */
    const openSingleAction = (req: EditRequest, action: 'approve' | 'reject') => {
        setDialogTarget(req);
        setDialogAction(action);
        setDialogOpen(true);
    };

    const handleSingleAction = async () => {
        if (!dialogTarget || !dialogAction) return;
        setIsSubmitting(true);
        try {
            await axios.patch(
                `${BACKEND_URL}/api/school/attendance-edit-requests/${dialogTarget.id}/${dialogAction}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(
                dialogAction === 'approve'
                    ? 'Request approved — attendance updated!'
                    : 'Request rejected.'
            );
            setDialogOpen(false);
            fetchRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Bulk actions ── */
    const openBulkAction = (action: 'approve' | 'reject') => {
        if (selectedIds.size === 0) {
            toast.warning('Select at least one request first.');
            return;
        }
        setBulkAction(action);
        setBulkDialogOpen(true);
    };

    const handleBulkAction = async () => {
        if (!bulkAction) return;
        setIsSubmitting(true);
        try {
            await axios.post(
                `${BACKEND_URL}/api/school/attendance-edit-requests/bulk-review`,
                { ids: [...selectedIds], action: bulkAction },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(
                bulkAction === 'approve'
                    ? `${selectedIds.size} request(s) approved!`
                    : `${selectedIds.size} request(s) rejected.`
            );
            setBulkDialogOpen(false);
            fetchRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Bulk action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Selection helpers ── */
    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const pendingFiltered = filteredRequests.filter((r) => r.status === 'pending');
    const allSelected =
        pendingFiltered.length > 0 && pendingFiltered.every((r) => selectedIds.has(r.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingFiltered.map((r) => r.id)));
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dt: string | null) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-50/50 space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Attendance Edit Requests
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Review and approve teacher requests to edit past attendance records
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchRequests}
                    disabled={isLoading}
                    className="self-start md:self-auto rounded-xl border-slate-200 font-semibold text-slate-700"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* ── Summary Stats ── */}
            {/* <div className="grid grid-cols-3 gap-4">
                <Card
                    className={`border shadow-sm rounded-2xl cursor-pointer transition-all ${filterStatus === 'pending' ? 'ring-2 ring-amber-400' : ''}`}
                    onClick={() => setFilterStatus('pending')}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Pending
                            </p>
                            <p className="text-3xl font-bold text-amber-600">{summary.pending}</p>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`border shadow-sm rounded-2xl cursor-pointer transition-all ${filterStatus === 'approved' ? 'ring-2 ring-emerald-400' : ''}`}
                    onClick={() => setFilterStatus('approved')}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Approved
                            </p>
                            <p className="text-3xl font-bold text-emerald-600">{summary.approved}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`border shadow-sm rounded-2xl cursor-pointer transition-all ${filterStatus === 'rejected' ? 'ring-2 ring-rose-400' : ''}`}
                    onClick={() => setFilterStatus('rejected')}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Rejected
                            </p>
                            <p className="text-3xl font-bold text-rose-600">{summary.rejected}</p>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <XCircle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div> */}

            {/* ── Class-Wise Tabs ── */}
            <div className="bg-white p-3 rounded-2xl border shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider px-2 shrink-0 border-r border-slate-200 pr-3 mr-1">
                    <Building2 className="w-4 h-4 text-violet-600" />
                    <span>Class Tabs:</span>
                </div>

                <button
                    onClick={() => {
                        setFilterClass('all');
                        setFilterDivision('all');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${filterClass === 'all'
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                        }`}
                >
                    <span>All Classes</span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${filterClass === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                            }`}
                    >
                        {requests.length}
                    </span>
                </button>

                {classList.map((cls) => {
                    const count = requests.filter(
                        (r) => String(r.class_id) === String(cls.id) || r.class_name === cls.class_name
                    ).length;
                    const isActive = String(filterClass) === String(cls.id) || filterClass === cls.class_name;

                    return (
                        <button
                            key={cls.id || cls.class_name}
                            onClick={() => {
                                setFilterClass(cls.id ? String(cls.id) : cls.class_name);
                                setFilterDivision('all');
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive
                                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                                }`}
                        >
                            <span>{cls.class_name}</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                                    }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Filters Bar ── */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap items-end gap-4">
                {/* Status Filter */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Status
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterStatus === s
                                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Class Filter Dropdown */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Class Filter
                    </label>
                    <div className="flex items-center gap-1.5">
                        <select
                            value={filterClass}
                            onChange={(e) => {
                                setFilterClass(e.target.value);
                                setFilterDivision('all');
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        >
                            <option value="all">All Classes</option>
                            {classList.map((cls) => (
                                <option key={cls.id || cls.class_name} value={cls.id ? String(cls.id) : cls.class_name}>
                                    {cls.class_name}
                                </option>
                            ))}
                        </select>
                        {filterClass !== 'all' && (
                            <button
                                onClick={() => {
                                    setFilterClass('all');
                                    setFilterDivision('all');
                                }}
                                className="text-slate-400 hover:text-slate-600"
                                title="Clear class filter"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Division Filter Dropdown */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Division Filter
                    </label>
                    <div className="flex items-center gap-1.5">
                        <select
                            value={filterDivision}
                            onChange={(e) => setFilterDivision(e.target.value)}
                            disabled={divisionList.length === 0}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        >
                            <option value="all">All Divisions</option>
                            {divisionList.map((div) => (
                                <option key={div.id || div.division_name} value={div.id ? String(div.id) : div.division_name}>
                                    Div {div.division_name}
                                </option>
                            ))}
                        </select>
                        {filterDivision !== 'all' && (
                            <button
                                onClick={() => setFilterDivision('all')}
                                className="text-slate-400 hover:text-slate-600"
                                title="Clear division filter"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Month Filter */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Month
                    </label>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                        {filterMonth && (
                            <button
                                onClick={() => setFilterMonth('')}
                                className="text-slate-400 hover:text-slate-600"
                                title="Clear month filter"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Search
                    </label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Student name, roll no, teacher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>
                </div>

                {/* Bulk Actions (only for pending filter) */}
                {filterStatus === 'pending' && (
                    <div className="flex items-end gap-2">
                        <Button
                            size="sm"
                            onClick={() => openBulkAction('approve')}
                            disabled={selectedIds.size === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs"
                        >
                            <CheckCheck className="w-3.5 h-3.5 mr-1" />
                            Approve Selected ({selectedIds.size})
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openBulkAction('reject')}
                            disabled={selectedIds.size === 0}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold text-xs"
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject Selected ({selectedIds.size})
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Requests Table ── */}
            <Card className="border shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 border-b py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span>{filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Requests</span>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 font-semibold">
                            {filteredRequests.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold text-sm">Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 space-y-2">
                            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-semibold text-base">No requests found</p>
                            <p className="text-xs text-slate-400">Try adjusting class/status filters or search query</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {filterStatus === 'pending' && (
                                            <th className="py-3.5 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={toggleSelectAll}
                                                    className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th className="py-3.5 px-4">Student</th>
                                        <th className="py-3.5 px-4">Class / Division</th>
                                        <th className="py-3.5 px-4">Date</th>
                                        <th className="py-3.5 px-4 text-center">Current → Requested</th>
                                        <th className="py-3.5 px-4">Teacher</th>
                                        <th className="py-3.5 px-4">Teacher Note</th>
                                        <th className="py-3.5 px-4 text-center">Status</th>
                                        {filterStatus === 'pending' && <th className="py-3.5 px-4 text-center">Actions</th>}
                                        {filterStatus !== 'pending' && <th className="py-3.5 px-4">Reviewed At</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {filteredRequests.map((r) => (
                                        <tr
                                            key={r.id}
                                            className={`hover:bg-slate-50/80 transition-colors ${selectedIds.has(r.id) ? 'bg-violet-50/40' : ''}`}
                                        >
                                            {filterStatus === 'pending' && (
                                                <td className="px-4 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(r.id)}
                                                        onChange={() => toggleSelect(r.id)}
                                                        className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                                                        disabled={r.status !== 'pending'}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-800">
                                                    {r.first_name} {r.last_name}
                                                </div>
                                                {r.roll_number && (
                                                    <div className="text-xs text-slate-400">Roll: {r.roll_number}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                    {r.class_name} – Div {r.division_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-slate-700">
                                                {formatDate(r.attendance_date)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${STATUS_COLORS[r.current_status ?? 'null']}`}
                                                    >
                                                        {STATUS_LABEL[r.current_status ?? 'null']}
                                                    </span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${STATUS_COLORS[r.requested_status]}`}
                                                    >
                                                        {STATUS_LABEL[r.requested_status]}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-slate-700 text-xs">
                                                    {r.teacher_name || `Teacher #${r.teacher_id}`}
                                                </div>
                                                {r.teacher_email && (
                                                    <div className="text-xs text-slate-400">{r.teacher_email}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 max-w-[180px]">
                                                {r.teacher_note ? (
                                                    <div className="flex items-start gap-1.5">
                                                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                        <span className="text-xs text-slate-600 line-clamp-2">{r.teacher_note}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {r.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                        <Clock className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                                {r.status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Approved
                                                    </span>
                                                )}
                                                {r.status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                        <XCircle className="w-3 h-3" /> Rejected
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Buttons (pending view) */}
                                            {filterStatus === 'pending' && (
                                                <td className="px-4 py-3.5 text-center">
                                                    {r.status === 'pending' ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openSingleAction(r, 'approve')}
                                                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openSingleAction(r, 'reject')}
                                                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Reviewed</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Reviewed at (non-pending view) */}
                                            {filterStatus !== 'pending' && (
                                                <td className="px-4 py-3.5 text-xs text-slate-500">
                                                    {formatDateTime(r.reviewed_at)}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Single Action Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle
                            className={`flex items-center gap-2 text-lg font-bold ${dialogAction === 'approve' ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                        >
                            {dialogAction === 'approve' ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            {dialogAction === 'approve' ? 'Approve' : 'Reject'} Edit Request
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="pt-1 space-y-2 text-sm text-slate-600">
                                {dialogTarget && (
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                                        <p>
                                            <span className="font-semibold">Student:</span>{' '}
                                            {dialogTarget.first_name} {dialogTarget.last_name}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Date:</span>{' '}
                                            {formatDate(dialogTarget.attendance_date)}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-semibold">Change:</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_COLORS[dialogTarget.current_status ?? 'null']}`}>
                                                {STATUS_LABEL[dialogTarget.current_status ?? 'null']}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_COLORS[dialogTarget.requested_status]}`}>
                                                {STATUS_LABEL[dialogTarget.requested_status]}
                                            </span>
                                        </p>
                                        {dialogTarget.teacher_note && (
                                            <p className="text-xs pt-1 border-t border-slate-200/80">
                                                <span className="font-semibold text-slate-700">Teacher Note:</span>{' '}
                                                <span className="italic text-slate-600">{dialogTarget.teacher_note}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isSubmitting}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSingleAction}
                            disabled={isSubmitting}
                            className={`rounded-xl font-bold ${dialogAction === 'approve'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : dialogAction === 'approve' ? (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirm {dialogAction === 'approve' ? 'Approval' : 'Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Bulk Action Dialog ── */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle
                            className={`flex items-center gap-2 text-lg font-bold ${bulkAction === 'approve' ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                        >
                            {bulkAction === 'approve' ? (
                                <CheckCheck className="w-5 h-5" />
                            ) : (
                                <X className="w-5 h-5" />
                            )}
                            Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} ({selectedIds.size} requests)
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            {bulkAction === 'approve'
                                ? 'This will approve all selected requests and update attendance records accordingly.'
                                : 'This will reject all selected requests.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setBulkDialogOpen(false)}
                            disabled={isSubmitting}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkAction}
                            disabled={isSubmitting}
                            className={`rounded-xl font-bold ${bulkAction === 'approve'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AttendanceEditRequests;
