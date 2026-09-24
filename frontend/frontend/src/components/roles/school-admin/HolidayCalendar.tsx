import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'HOLIDAY' | 'EVENT' | 'EXAM'>('HOLIDAY');

  const [eventDate, setEventDate] = useState('');

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

  const createMutation = useMutation({
    mutationFn: calendarService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastEventAdded'));
      handleClose();
    },
    onError: () => toast.error(t('holidayCalendar.toastAddFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) =>
      calendarService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastEventUpdated'));
      handleClose();
    },
    onError: () => toast.error(t('holidayCalendar.toastUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: calendarService.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastEventDeleted'));
    },
    onError: () => toast.error(t('holidayCalendar.toastDeleteFailed')),
  });

  const deleteRangeMutation = useMutation({
    mutationFn: calendarService.deleteRange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t('holidayCalendar.toastRangeDeleted'));
      setDeleteRangeOpen(false);
      setRangeStart('');
      setRangeEnd('');
      setRangeType('HOLIDAY');
    },
    onError: () => toast.error(t('holidayCalendar.toastRangeDeleteFailed')),
  });

  const handleSave = () => {
    if (!title || !eventDate) {
      toast.error(t('holidayCalendar.toastTitleDateRequired'));
      return;
    }

    // Check availability
    const isCollision = events.some(
      (e) => e.calendar_date === eventDate && e.id !== editingEvent?.id
    );

    if (isCollision) {
      toast.error(t('holidayCalendar.toastOneEventPerDay'));
      return;
    }

    if (editingEvent?.id) {
      updateMutation.mutate({
        id: editingEvent.id,
        data: { title, type, calendar_date: eventDate },
      });
    } else {
      createMutation.mutate({ title, type, calendar_date: eventDate });
    }
  };

  const handleDelete = (id?: string) => {
    if (!id || !window.confirm(t('holidayCalendar.confirmDeleteEvent'))) return;
    deleteMutation.mutate(id);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setType(event.type);
    setEventDate(event.calendar_date);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    setTitle('');
    setType('HOLIDAY');
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
      exams: events.filter((e) => e.type === 'EXAM').length,
      events: events.filter((e) => e.type === 'EVENT').length,
    }),
    [events]
  );

  return (
    <div className="h-dvh bg-gray-100 p-4 flex flex-col gap-4 overflow-auto">
      {/* HEADER */}
      <div className="flex-none flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('holidayCalendar.title')}</h1>
          <p className="text-sm text-gray-500">{t('holidayCalendar.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            className="h-9"
            size="sm"
            onClick={() => setDeleteRangeOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('holidayCalendar.deleteRange')}
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
                setOpen(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('holidayCalendar.addEvent')}
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="flex-none grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t('holidayCalendar.statTotal')} value={stats.total} icon={CalendarDays} />
        <StatCard title={t('holidayCalendar.statHolidays')} value={stats.holidays} icon={Flag} />
        <StatCard title={t('holidayCalendar.statExams')} value={stats.exams} icon={BookOpen} />
        <StatCard title={t('holidayCalendar.statEvents')} value={stats.events} icon={CalendarDays} />
      </div>

      {/* MAIN LAYOUT - Scaled to fit remaining height */}
      <div className="flex-1 min-h-0 grid sm:grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT - EVENTS FOR MONTH (4/12) */}
        <div className="order-2 sm:col-span-1 md:col-span-4 h-[70dvh]">
          <Card className="h-full w-full shadow-md border-gray-100 overflow-hidden flex flex-col gap-0">
            <CardHeader className="bg-slate-50/50 border-b border-gray-100 py-3 px-4 mb-0 flex-none">
              <CardTitle className="text-lg font-bold text-gray-800">
                {format(month, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription className="text-green-600 font-medium italic text-xs">
                {t('holidayCalendar.scheduleForMonth')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="p-3 space-y-2 custom-scrollbar">
                {monthEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">{t('holidayCalendar.noEventsForMonth')}</p>
                  </div>
                ) : (
                  monthEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group flex gap-3 p-2 rounded-lg border border-gray-100 bg-white hover:border-green-200 hover:shadow-sm transition-all"
                    >
                      {/* Date Box */}
                      <div
                        className={`flex flex-col items-center justify-center min-w-[45px] p-1.5 rounded-lg ${event.type === 'HOLIDAY'
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
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-medium">
                            {event.type}
                          </Badge>

                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-gray-400 hover:text-green-600"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-gray-400 hover:text-red-600"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
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
                    day_selected: 'bg-green-600! text-white! hover:bg-green-700!',
                    day_today: 'bg-slate-50 border-slate-200 font-bold text-slate-900',
                    day_outside: 'text-gray-300 opacity-50',
                  }}
                  components={{
                    DayContent: ({ date: d }) => {
                      const dayEvents = events.filter((e) =>
                        isSameDay(parseISO(e.calendar_date), d)
                      );
                      return (
                        <div className="flex flex-col items-center justify-start h-full w-full">
                          <span className="text-sm font-semibold mb-1">{d.getDate()}</span>
                          <div className="flex gap-1 flex-wrap justify-center w-full px-1">
                            {dayEvents.map((ev, i) => (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${ev.type === 'HOLIDAY'
                                    ? 'bg-red-500'
                                    : ev.type === 'EXAM'
                                      ? 'bg-orange-500'
                                      : 'bg-blue-500'
                                  }`}
                                title={ev.title}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? t('holidayCalendar.editEvent') : t('holidayCalendar.addEventTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.eventTitle')}</label>
              <Input
                placeholder={t('holidayCalendar.enterTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.category')}</label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('holidayCalendar.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOLIDAY">{t('holidayCalendar.holiday')}</SelectItem>
                  <SelectItem value="EVENT">{t('holidayCalendar.event')}</SelectItem>
                  <SelectItem value="EXAM">{t('holidayCalendar.exam')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.date')}</label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('holidayCalendar.cancel')}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingEvent ? t('holidayCalendar.update') : t('holidayCalendar.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE RANGE MODAL */}
      <Dialog open={deleteRangeOpen} onOpenChange={setDeleteRangeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('holidayCalendar.deleteEventsInRange')}</DialogTitle>
            <CardDescription>
              {t('holidayCalendar.deleteRangeDesc')}
            </CardDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('holidayCalendar.startDate')}</label>
                <Input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('holidayCalendar.endDate')}</label>
                <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('holidayCalendar.eventTypeToDelete')}</label>
              <Select value={rangeType} onValueChange={(v: any) => setRangeType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('holidayCalendar.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOLIDAY">{t('holidayCalendar.holiday')}</SelectItem>
                  <SelectItem value="EVENT">{t('holidayCalendar.event')}</SelectItem>
                  <SelectItem value="EXAM">{t('holidayCalendar.exam')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRangeOpen(false)}>
              {t('holidayCalendar.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rangeStart || !rangeEnd) {
                  toast.error(t('holidayCalendar.toastSelectDates'));
                  return;
                }
                if (new Date(rangeStart) > new Date(rangeEnd)) {
                  toast.error(t('holidayCalendar.toastStartDateAfterEnd'));
                  return;
                }
                if (
                  window.confirm(t('holidayCalendar.confirmDeleteRange'))
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
              {t('holidayCalendar.deleteEvents')}
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
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="p-2 rounded-lg bg-green-100">
          <Icon className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
