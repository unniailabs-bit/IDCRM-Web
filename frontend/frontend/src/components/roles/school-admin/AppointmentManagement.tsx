import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import {
    Search,
    Plus,
    Mail,
    Phone,
    Clock,
    Briefcase,
    User,
    Edit2,
    Trash2,
    Calendar,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../hooks/useAuth';
import { appointmentService, TeacherAppointment } from '../../../api/appointmentService';

export function AppointmentManagement() {
    const { t } = useTranslation();
    const { userData } = useAuth();
    const [appointments, setAppointments] = useState<TeacherAppointment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | number | null>(null);

    const [formData, setFormData] = useState({
        teacher_name: '',
        email: '',
        phone_number: '',
        designation: '',
        available_from: '',
        available_to: '',
        operational_notes: '',
        status: 'active' as 'active' | 'inactive',
    });

    // Fetch appointments from API
    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        if (!userData?.id) return;
        setLoading(true);
        try {
            const response = await appointmentService.getAppointments(userData.id);
            const data = response.data || response;
            if (Array.isArray(data)) {
                setAppointments(data);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setFormData({
            teacher_name: '',
            email: '',
            phone_number: '',
            designation: '',
            available_from: '',
            available_to: '',
            operational_notes: '',
            status: 'active',
        });
        setIsEditing(false);
        setCurrentId(null);
        setIsAddDialogOpen(true);
    };

    const handleEdit = (appointment: TeacherAppointment) => {
        setFormData({
            teacher_name: appointment.teacher_name,
            email: appointment.email,
            phone_number: appointment.phone_number,
            designation: appointment.designation,
            available_from: appointment.available_from,
            available_to: appointment.available_to,
            operational_notes: appointment.operational_notes || '',
            status: appointment.status,
        });
        setIsEditing(true);
        setCurrentId(appointment.id || null);
        setIsAddDialogOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await appointmentService.deleteAppointment(id);
                setAppointments(prev => prev.filter((a) => a.id !== id));
                toast.success('Appointment deleted successfully');
            } catch (error) {
                toast.error('Failed to delete appointment');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.teacher_name || !formData.available_from || !formData.available_to) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!userData?.id) {
            toast.error('Session error: Please log in again.');
            return;
        }

        try {
            const payload = {
                ...formData,
                school_id: userData.id
            };

            if (isEditing && currentId) {
                const response = await appointmentService.updateAppointment(currentId, payload);
                if (response.success || response) {
                    toast.success('Schedule updated successfully');
                    fetchAppointments();
                }
            } else {
                const response = await appointmentService.createAppointment(payload);
                if (response.success || response) {
                    toast.success('New Appointment added successfully');
                    fetchAppointments();
                }
            }
            setIsAddDialogOpen(false);
        } catch (error) {
            toast.error(isEditing ? 'Failed to update Appointment' : 'Failed to add  appointment');
        }
    };

    const toggleStatus = async (appointment: TeacherAppointment) => {
        if (!appointment.id) return;

        const newStatus = appointment.status === 'active' ? 'inactive' : 'active';
        try {
            await appointmentService.updateAppointment(appointment.id, {
                ...appointment,
                status: newStatus
            });
            setAppointments(prev =>
                prev.map(a => a.id === appointment.id ? { ...a, status: newStatus } : a)
            );
            toast.info(`Schedule ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        } catch (error: any) {
            toast.error('Failed to update status');
        }
    };

    const filteredAppointments = appointments.filter(
        (a) =>
            (a.teacher_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-4 sm:p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Appointment System</h1>
                        <p className="text-slate-500 text-base sm:text-lg font-medium">Manage teacher availability and consultation hours.</p>
                    </div>
                    <Button
                        onClick={handleOpenAdd}
                        className="h-12 px-8 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto font-bold uppercase tracking-wide text-xs"
                    >
                        <span>Add New Appointment</span>
                    </Button>
                </div>

                {/* Analytic Cards */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                        <CardContent className="p-5 sm:p-7">
                            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Mentors</p>
                            <p className="text-3xl sm:text-4xl font-black text-slate-800">{appointments.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                        <CardContent className="p-5 sm:p-7">
                            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Active Slots</p>
                            <p className="text-3xl sm:text-4xl font-black text-emerald-600">
                                {appointments.filter(a => a.status === 'active').length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white group overflow-hidden relative sm:col-span-2 lg:col-span-1">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                        <CardContent className="p-5 sm:p-7">
                            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Departments</p>
                            <p className="text-3xl sm:text-4xl font-black text-slate-800">
                                {new Set(appointments.map(a => a.designation)).size}
                            </p>
                        </CardContent>
                    </Card>
                </div> */}

                {/* Main Content Area */}
                <Card className="border-none shadow-2xl shadow-slate-300/40 bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 p-5 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="space-y-1">
                                {/* <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">Teacher Availability Registry</CardTitle> */}
                                {/* <CardDescription className="text-slate-500 font-medium italic">Showing {filteredAppointments.length} matching schedules</CardDescription> */}
                            </div>
                            <div className="relative group w-full lg:w-96">
                                <Input
                                    placeholder="Search by name, role or email..."
                                    className="w-full h-12 bg-slate-50 border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all border-none px-6"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="px-4 sm:px-8 py-5 font-bold text-slate-600 tracking-wide uppercase text-xs">Faculty Details</TableHead>
                                            <TableHead className="px-4 sm:px-8 py-5 font-bold text-slate-600 tracking-wide uppercase text-xs">Contact </TableHead>
                                            <TableHead className="px-4 sm:px-8 py-5 font-bold text-slate-600 tracking-wide uppercase text-xs">Availability </TableHead>
                                            {/* <TableHead className="px-4 sm:px-8 py-5 font-bold text-slate-600 tracking-wide uppercase text-xs">Status</TableHead> */}
                                            <TableHead className="px-4 sm:px-8 py-5 text-right font-bold text-slate-600 tracking-wide uppercase text-xs">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAppointments.length > 0 ? (
                                            filteredAppointments.map((appointment) => (
                                                <TableRow key={appointment.id} className="group hover:bg-indigo-50/30 transition-all duration-200 border-b border-slate-50">
                                                    <TableCell className="px-4 sm:px-8 py-6">
                                                        <div className="space-y-1.5 overflow-hidden">
                                                            <p className="font-bold text-slate-900 text-base sm:text-lg leading-none truncate tracking-tight">{appointment.teacher_name}</p>
                                                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{appointment.designation}</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 sm:px-8 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-sm font-semibold text-slate-600 truncate">{appointment.email}</span>
                                                            <span className="text-sm font-semibold text-slate-600">{appointment.phone_number}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 sm:px-8 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="text-indigo-700 font-black bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-xl w-fit text-sm tabular-nums tracking-tight">
                                                                {appointment.available_from} — {appointment.available_to}
                                                            </div>
                                                            {appointment.operational_notes && (
                                                                <span className="text-xs font-medium text-slate-500 italic max-w-[200px] sm:max-w-xs line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                                                    {appointment.operational_notes}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    {/* <TableCell className="px-4 sm:px-8 py-6">
                                                        <button
                                                            onClick={() => toggleStatus(appointment)}
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${appointment.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            <span>{appointment.status === 'active' ? 'ACTIVE' : 'INACTIVE'}</span>
                                                        </button>
                                                    </TableCell> */}
                                                    <TableCell className="px-4 sm:px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 sm:gap-3 transition-all">
                                                            <Button
                                                                variant="outline"
                                                                className="h-9 px-4 border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm transition-all text-xs font-bold"
                                                                onClick={() => handleEdit(appointment)}
                                                            >
                                                                EDIT
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="h-9 px-4 border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm transition-all text-xs font-bold"
                                                                onClick={() => handleDelete(appointment.id)}
                                                            >
                                                                DELETE
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-64 sm:h-96 text-center">
                                                    <div className="flex flex-col items-center justify-center bg-slate-50/50 m-4 sm:m-8 rounded-3xl p-8 sm:p-12 border-2 border-dashed border-slate-200">
                                                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No  found</h3>
                                                        <p className="text-slate-500 text-sm sm:text-base max-w-xs mx-auto mb-6 sm:mb-8">We couldn't find any teacher availability data. Start by creating a new entry.</p>
                                                        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wide text-xs h-12 px-8">Add First Appointment</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Advanced Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg p-0 overflow-hidden border-none shadow-3xl rounded-[1.5rem] max-h-[90vh] overflow-y-auto m-4">
                    <div className="bg-violet-600 px-6 sm:px-8 py-6 sm:py-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400/20 rounded-full blur-2xl" />

                        <div className="relative z-10">
                            <h2 className="text-2xl sm:text-2xl font-black tracking-tight mb-1 text-white">
                                {isEditing ? 'REFINE SCHEDULE' : 'Add Appoinment'}
                            </h2>
                            {/* <p className="text-indigo-100 text-sm sm:text-base font-medium opacity-90 leading-tight max-w-xs">
                                Configure the availability for this profile.
                            </p> */}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-8 bg-white space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Teacher Name <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="teacher_name"
                                    placeholder="e.g. Dr. Robert"
                                    className="h-11 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm px-4"
                                    value={formData.teacher_name}
                                    onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="designation" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Designation</Label>
                                <Input
                                    id="designation"
                                    placeholder="e.g. Senior Professor"
                                    className="h-11 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm px-4"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email ID</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@school.com"
                                    className="h-11 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm px-4"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone_number" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number</Label>
                                <Input
                                    id="phone_number"
                                    placeholder="+91 XXXXX XXXXX"
                                    className="h-11 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm px-4"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="available_from" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Available From <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="available_from"
                                    type="time"
                                    className="h-11 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm px-4"
                                    value={formData.available_from}
                                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="available_to" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Available To <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="available_to"
                                    type="time"
                                    className="h-11 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm px-4"
                                    value={formData.available_to}
                                    onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="operational_notes" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Operational Notes</Label>
                                <textarea
                                    id="operational_notes"
                                    rows={2}
                                    placeholder="Any room numbers or weekly exceptions..."
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 text-sm outline-none transition-all resize-none"
                                    value={formData.operational_notes}
                                    onChange={(e) => setFormData({ ...formData, operational_notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddDialogOpen(false)}
                                className="flex-1 h-11 rounded-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[1.5] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 text-xs uppercase tracking-wider"
                            >
                                {isEditing ? 'Save Changes' : 'Confirm '}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
