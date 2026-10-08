import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Loader2,
  CalendarDays,
  Flag,
  BookOpen,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  UserCheck,
  UserX,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { format, parseISO, isSameDay, isSameMonth } from 'date-fns';
import { calendarService, CalendarEvent } from '@/api/calendarService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function HolidayCalendar() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState(new Date());
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'HOLIDAY' | 'EVENT' | 'EXAM'>('HOLIDAY');
  const [eventDate, setEventDate] = useState('');
  const [isAttendanceRequired, setIsAttendanceRequired] = useState(false);

  // Delete Range State
  const [deleteRangeOpen, setDeleteRangeOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeType, setRangeType] = useState<'HOLIDAY' | 'EVENT' | 'EXAM'>('HOLIDAY');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async () => {
      const res = await calendarService.getEventsByToken();
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const savedWeekdays = new Set<number>();

    events.forEach((event) => {
      if (event.type !== 'HOLIDAY' || event.title !== 'School Holiday' || !event.calendar_date.startsWith(`${currentYear}-`)) return;
      const eventDate = new Date(`${event.calendar_date}T00:00:00`);
      if (!Number.isNaN(eventDate.getTime())) savedWeekdays.add(eventDate.getDay());
    });

    setSelectedWeekdays(savedWeekdays);
  }, [events]);

  const saveSelectedWeekdays = () => {
    if (selectedWeekdays.size === 0) {
      toast.error('Select at least one holiday day');
      return;
    }

    const currentYear = new Date().getFullYear();
    const weekdays = [...selectedWeekdays].sort((a, b) => a - b);

    recurringHolidayMutation.mutate({
      year: currentYear,
      weekdays,
      title: 'School Holiday',
    });
  };

  const createMutation = useMutation({
    mutationFn: calendarService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastEventAdded', 'Event added successfully'));
      handleClose();
    },
    onError: () => toast.error(t('holidayCalendar.toastAddFailed', 'Failed to add event')),
  });
  const recurringHolidayMutation = useMutation({
    mutationFn: calendarService.saveRecurringHolidays,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(`Saved ${selectedWeekdays.size} holiday days for ${new Date().getFullYear()}`);
    },
    onError: () => toast.error('Failed to save selected holiday days'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) =>
      calendarService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastEventUpdated', 'Event updated successfully'));
      handleClose();
    },
    onError: () => toast.error(t('holidayCalendar.toastUpdateFailed', 'Failed to update event')),
  });

  const deleteMutation = useMutation({
    mutationFn: calendarService.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastEventDeleted', 'Event deleted successfully'));
    },
    onError: () => toast.error(t('holidayCalendar.toastDeleteFailed', 'Failed to delete event')),
  });

  const deleteRangeMutation = useMutation({
    mutationFn: calendarService.deleteRange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastRangeDeleted', 'Range deleted successfully'));
      setDeleteRangeOpen(false);
      setRangeStart('');
      setRangeEnd('');
      setRangeType('HOLIDAY');
    },
    onError: () => toast.error(t('holidayCalendar.toastRangeDeleteFailed', 'Failed to delete range')),
  });

  const handleSave = () => {
    if (!title || !eventDate) {
      toast.error(t('holidayCalendar.toastTitleDateRequired', 'Title and date are required'));
      return;
    }

    // Check availability
    const isCollision = events.some(
      (e) => e.calendar_date === eventDate && e.id !== editingEvent?.id
    );

    if (isCollision) {
      toast.error(t('holidayCalendar.toastOneEventPerDay', 'An event already exists on this date'));
      return;
    }

    if (editingEvent?.id) {
      updateMutation.mutate({
        id: editingEvent.id,
        data: {
          title,
          type,
          calendar_date: eventDate,
          is_attendance_required: isAttendanceRequired,
        },
      });
    } else {
      createMutation.mutate({
        title,
        type,
        calendar_date: eventDate,
        is_attendance_required: isAttendanceRequired,
      });
    }
  };

  const handleDelete = (id?: string) => {
    if (!id || !window.confirm(t('holidayCalendar.confirmDeleteEvent', 'Are you sure you want to delete this event?'))) return;
    deleteMutation.mutate(id);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setType(event.type);
    setEventDate(event.calendar_date);
    setIsAttendanceRequired(Boolean(event.is_attendance_required));
    setOpen(true);
  };

  const handleToggleAttendance = (event: CalendarEvent) => {
    if (!event.id) return;
    const nextState = !event.is_attendance_required;
    updateMutation.mutate(
      {
        id: event.id,
        data: { is_attendance_required: nextState },
      },
      {
        onSuccess: () => {
          window.dispatchEvent(new Event('calendarDataChanged'));
          if (nextState) {
            toast.success(`Deselected holiday on ${event.calendar_date}: Marked as Regular Attendance Day`);
          } else {
            toast.info(`Marked ${event.calendar_date} as School Closed Holiday`);
          }
        },
      }
    );
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    setTitle('');
    setType('HOLIDAY');
    setIsAttendanceRequired(false);
  };

  const monthEvents = useMemo(
    () =>
      events
        .filter((e) => isSameMonth(parseISO(e.calendar_date), month))
        .sort((a, b) => parseISO(a.calendar_date).getTime() - parseISO(b.calendar_date).getTime()),
    [events, month]
  );

  const stats = useMemo(
    () => ({
      total: events.length,
      holidays: events.filter((e) => e.type === 'HOLIDAY').length,
      attendanceHolidays: events.filter((e) => e.type === 'HOLIDAY' && e.is_attendance_required).length,
      exams: events.filter((e) => e.type === 'EXAM').length,
      events: events.filter((e) => e.type === 'EVENT').length,
    }),
    [events]
  );

  return (
    <div className="h-dvh bg-gray-100 p-4 flex flex-col gap-4 overflow-auto">
      {/* HEADER */}
      <div className="flex-none flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('holidayCalendar.title', 'Holiday & Event Calendar')}</h1>
          <p className="text-sm text-gray-500">{t('holidayCalendar.subtitle', 'Manage school holidays, events, exams, and attendance days')}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-red-600" />
            <span>Holiday Days</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                const isSelected = selectedWeekdays.has(index);
                return (
                  <label
                    key={day}
                    className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${isSelected ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedWeekdays((prev) => {
                          const next = new Set(prev);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        });
                      }}
                      className="h-3.5 w-3.5 accent-red-600"
                    />
                    {day}
                  </label>
                );
              })}
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 px-2.5"
              onClick={saveSelectedWeekdays}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <Button
            variant="destructive"
            className="h-9"
            size="sm"
            onClick={() => setDeleteRangeOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('holidayCalendar.deleteRange', 'Delete Range')}
          </Button>

          <Button
            className="bg-green-600 hover:bg-green-700 h-9"
            size="sm"
            onClick={() => {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const existingArgs = events.find((e) => e.calendar_date === todayStr);

              if (existingArgs) {
                handleEdit(existingArgs);
              } else {
                setEventDate(todayStr);
                setEditingEvent(null);
                setTitle('');
                setType('HOLIDAY');
                setIsAttendanceRequired(false);
                setOpen(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('holidayCalendar.addEvent', 'Add Event / Holiday')}
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="flex-none grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title={t('holidayCalendar.statTotal', 'Total Entries')} value={stats.total} icon={CalendarDays} />
        <StatCard title={t('holidayCalendar.statHolidays', 'Holidays')} value={stats.holidays} icon={Flag} />
        <StatCard title={t('holidayCalendar.statAttendanceDays', 'Working Holidays')} value={stats.attendanceHolidays} icon={UserCheck} />
        <StatCard title={t('holidayCalendar.statExams', 'Exams')} value={stats.exams} icon={BookOpen} />
        <StatCard title={t('holidayCalendar.statEvents', 'Events')} value={stats.events} icon={CalendarDays} />
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex-1 min-h-0 grid sm:grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT - EVENTS FOR MONTH (4/12) */}
        <div className="order-2 sm:col-span-1 md:col-span-4 h-[70dvh]">
          <Card className="h-full w-full shadow-md border-gray-100 overflow-hidden flex flex-col gap-0">
            <CardHeader className="bg-slate-50/50 border-b border-gray-100 py-3 px-4 mb-0 flex-none">
              <CardTitle className="text-lg font-bold text-gray-800">
                {format(month, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription className="text-green-600 font-medium italic text-xs">
                {t('holidayCalendar.scheduleForMonth', 'Schedule for selected month')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="p-3 space-y-2.5 custom-scrollbar">
                {monthEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">{t('holidayCalendar.noEventsForMonth', 'No events for this month')}</p>
                  </div>
                ) : (
                  monthEvents.map((event) => {
                    const isWorkingHoliday = Boolean(event.is_attendance_required);
                    return (
                      <div
                        key={event.id}
                        className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isWorkingHoliday
                            ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 shadow-xs'
                            : 'border-gray-100 bg-white hover:border-green-200 hover:shadow-sm'
                          }`}
                      >
                        {/* Date Box */}
                        <div
                          className={`flex flex-col items-center justify-center min-w-[48px] p-2 rounded-lg ${isWorkingHoliday
                              ? 'bg-emerald-100 text-emerald-800'
                              : event.type === 'HOLIDAY'
                                ? 'bg-red-50 text-red-600'
                                : event.type === 'EXAM'
                                  ? 'bg-orange-50 text-orange-600'
                                  : 'bg-blue-50 text-blue-600'
                            }`}
                        >
                          <span className="text-[10px] font-bold uppercase">
                            {format(parseISO(event.calendar_date), 'MMM')}
                          </span>
                          <span className="text-base font-bold leading-none">
                            {format(parseISO(event.calendar_date), 'dd')}
                          </span>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="font-bold text-gray-800 text-sm truncate">{event.title}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-medium">
                              {event.type}
                            </Badge>
                            {isWorkingHoliday ? (
                              <Badge className="text-[10px] px-1.5 h-4 bg-emerald-600 text-white font-semibold">
                                <UserCheck className="w-2.5 h-2.5 mr-1" />
                                Regular Attendance Day
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 h-4 text-slate-500 border-slate-200">
                                School Closed
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 ${isWorkingHoliday
                                ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            title={
                              isWorkingHoliday
                                ? 'Deselect Attendance: Mark as Closed Holiday'
                                : 'Select Holiday for Activities: Count as Regular Attendance Day'
                            }
                            onClick={() => handleToggleAttendance(event)}
                          >
                            {isWorkingHoliday ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-gray-400 hover:text-green-600"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-gray-400 hover:text-red-600"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT - CALENDAR (8/12) */}
        <div className="sm:col-span-1 md:col-span-8 h-full">
          <Card className="h-full shadow-md border-gray-100 overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col justify-center items-center">
              {isLoading ? (
                <div className="flex justify-center items-center h-full w-full">
                  <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  onDayClick={(d) => {
                    if (!d) return;
                    setDate(d);
                    const dStr = format(d, 'yyyy-MM-dd');
                    const existingArgs = events.find((e) => e.calendar_date === dStr);

                    if (existingArgs) {
                      handleEdit(existingArgs);
                    } else {
                      setEventDate(dStr);
                      setOpen(true);
                      setEditingEvent(null);
                      setTitle('');
                      setType('HOLIDAY');
                      setIsAttendanceRequired(false);
                    }
                  }}
                  onMonthChange={setMonth}
                  className="w-full h-full p-4 flex flex-col"
                  classNames={{
                    months: 'flex flex-col w-full h-full',
                    month: 'space-y-4 w-full h-full flex flex-col',
                    caption: 'flex justify-center pt-2 relative items-center mb-2 px-10 flex-none',
                    caption_label: 'text-xl font-bold text-gray-800',
                    nav: 'space-x-1 flex items-center',
                    nav_button:
                      'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-200 rounded hover:bg-slate-50',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full h-full border-collapse flex-1',
                    tbody: 'w-full h-full flex flex-col',
                    head_row: 'flex w-full mb-2 flex-none',
                    head_cell:
                      'text-gray-400 rounded-md flex-1 font-bold text-[0.8rem] uppercase tracking-wider text-center',
                    row: 'flex w-full mt-1 flex-1',
                    cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 h-full',
                    day: 'h-full w-full p-2 font-medium aria-selected:opacity-100 hover:bg-slate-50 rounded-lg transition-colors flex flex-col items-center justify-start border border-transparent hover:border-slate-200',
                    day_selected: 'bg-red-600! text-white! hover:bg-red-700! ring-2 ring-red-200!',
                    day_today: 'bg-slate-50 border-slate-200 font-bold text-slate-900',
                    day_outside: 'text-gray-300 opacity-50',
                  }}
                  components={{
                    DayContent: ({ date: d }) => {
                      const dayEvents = events.filter((e) =>
                        isSameDay(parseISO(e.calendar_date), d)
                      );
                      return (
                        <div className="relative flex flex-col items-center justify-start h-full w-full rounded-lg">
                          <span className="text-sm font-semibold mb-1">{d.getDate()}</span>
                          <div className="flex gap-1 flex-wrap justify-center w-full px-1">
                            {dayEvents.map((ev, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full ${ev.is_attendance_required
                                    ? 'bg-emerald-500 ring-2 ring-emerald-200'
                                    : ev.type === 'HOLIDAY'
                                      ? 'bg-red-500'
                                      : ev.type === 'EXAM'
                                        ? 'bg-orange-500'
                                        : 'bg-blue-500'
                                  }`}
                                title={`${ev.title}${ev.is_attendance_required ? ' (Regular Attendance Day)' : ' (School Closed)'}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ADD/EDIT EVENT MODAL */}
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingEvent ? t('holidayCalendar.editEvent', 'Edit Calendar Entry') : t('holidayCalendar.addEventTitle', 'Add Calendar Entry')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.eventTitle', 'Title / Event Name')}</label>
              <Input
                placeholder={t('holidayCalendar.enterTitle', 'e.g. Independence Day, Annual Sports Day')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.category', 'Category')}</label>
              <Select value={type} onValueChange={(v: any) => {
                setType(v);
                if (v === 'EXAM' || v === 'EVENT') {
                  setIsAttendanceRequired(true);
                }
              }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('holidayCalendar.selectType', 'Select type')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="HOLIDAY">{t('holidayCalendar.holiday', 'Holiday')}</SelectItem>
                  <SelectItem value="EVENT">{t('holidayCalendar.event', 'Event')}</SelectItem>
                  <SelectItem value="EXAM">{t('holidayCalendar.exam', 'Exam')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.date', 'Date')}</label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="rounded-xl" />
            </div>

            {/* Attendance Required Toggle for Activities on Holidays */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 gap-3">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    {t('holidayCalendar.attendanceRequired', 'Count as Regular Attendance Day')}
                  </label>
                  <p className="text-xs text-slate-500">
                    {isAttendanceRequired
                      ? 'Students are called to school for activities. Teachers can mark attendance.'
                      : 'School closed. Teachers cannot mark attendance on this date.'}
                  </p>
                </div>
                <Switch
                  checked={isAttendanceRequired}
                  onCheckedChange={setIsAttendanceRequired}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} className="rounded-xl">
              {t('holidayCalendar.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 rounded-xl font-bold"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingEvent ? t('holidayCalendar.update', 'Update Event') : t('holidayCalendar.save', 'Save Event')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE RANGE MODAL */}
      <Dialog open={deleteRangeOpen} onOpenChange={setDeleteRangeOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('holidayCalendar.deleteEventsInRange', 'Delete Events in Range')}</DialogTitle>
            <CardDescription>
              {t('holidayCalendar.deleteRangeDesc', 'Remove all calendar events of specified type within date range')}
            </CardDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('holidayCalendar.startDate', 'Start Date')}</label>
                <Input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('holidayCalendar.endDate', 'End Date')}</label>
                <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.eventTypeToDelete', 'Category to Delete')}</label>
              <Select value={rangeType} onValueChange={(v: any) => setRangeType(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('holidayCalendar.selectType', 'Select type')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="HOLIDAY">{t('holidayCalendar.holiday', 'Holiday')}</SelectItem>
                  <SelectItem value="EVENT">{t('holidayCalendar.event', 'Event')}</SelectItem>
                  <SelectItem value="EXAM">{t('holidayCalendar.exam', 'Exam')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteRangeOpen(false)} className="rounded-xl">
              {t('holidayCalendar.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold"
              onClick={() => {
                if (!rangeStart || !rangeEnd) {
                  toast.error(t('holidayCalendar.toastSelectDates', 'Please select start and end dates'));
                  return;
                }
                if (new Date(rangeStart) > new Date(rangeEnd)) {
                  toast.error(t('holidayCalendar.toastStartDateAfterEnd', 'Start date cannot be after end date'));
                  return;
                }
                if (
                  window.confirm(t('holidayCalendar.confirmDeleteRange', 'Are you sure you want to delete all events in this range?'))
                ) {
                  deleteRangeMutation.mutate({
                    start_date: rangeStart,
                    end_date: rangeEnd,
                    type: rangeType,
                  });
                }
              }}
              disabled={deleteRangeMutation.isPending}
            >
              {deleteRangeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('holidayCalendar.deleteEvents', 'Delete Events')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- STATS CARD ---------- */

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card className="rounded-xl shadow-xs border-slate-200">
      <CardContent className="flex items-center gap-3 p-3.5">
        <div className="p-2 rounded-lg bg-green-100 shrink-0">
          <Icon className="h-4 w-4 text-green-700" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
          <p className="text-xl font-bold text-slate-800 leading-none mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
