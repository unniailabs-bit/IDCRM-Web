import { MetricCard } from '../../common/MetricCard';
import {
  Users,
  GraduationCap,
  FormInput,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Loader2,
  Bell,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  schoolDashboardApi,
  SchoolDashboardOverview,
  ClasswiseIdStatus,
  QuickStats,
  RecentActivity,
} from '@/api/schoolDashboard';
import { toast } from 'sonner';

export function SchoolAdminDashboard() {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SchoolDashboardOverview | null>(null);
  const [classData, setClassData] = useState<ClasswiseIdStatus[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [userData]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, classDataRes, quickStatsRes, activityRes] = await Promise.all([
        schoolDashboardApi.getOverview(),
        schoolDashboardApi.getClasswiseIdStatus(),
        schoolDashboardApi.getQuickStats(),
        schoolDashboardApi.getRecentActivity(),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (classDataRes.success) setClassData(classDataRes.data);
      if (quickStatsRes.success) setQuickStats(quickStatsRes.data);
      if (activityRes.success) setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(t('schoolAdminDashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) return;

    setSendingNotification(true);
    try {
      const response = await schoolDashboardApi.sendNotification({
        message: notificationMessage.trim(),
      });

      if (response.success) {
        toast.success(t('schoolAdminDashboard.notificationSuccess'));
        setNotificationMessage('');
        setIsNotificationModalOpen(false);
      } else {
        toast.error(response.message || t('schoolAdminDashboard.notificationFailed'));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(t('schoolAdminDashboard.notificationFailed'));
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="px-8 py-5 bg-white">
      <div className="justify-between flex items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('schoolAdminDashboard.title')}</h1>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            {userData && userData.name ? userData.name : t('schoolAdminDashboard.yourSchool')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">{t('schoolAdminDashboard.academicYear')}</p>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 bg-red-100 border border-red-200 text-red-600 hover:bg-red-100 transition-colors relative"
            onClick={() => navigate('/school-dashboard/notifications')}
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
            <Card className="shadow-xl rounded-xl">
              <MetricCard
                title={t('schoolAdminDashboard.totalStudents')}
                value={overview ? formatNumber(overview.totalStudents) : '0'}
                icon={GraduationCap}
                trend={
                  overview && overview.newAdmissions > 0
                    ? t('schoolAdminDashboard.newAdmissions', { count: overview.newAdmissions })
                    : ''
                }
                trendUp={true}
                variant="violet"
              />
            </Card>

            <Card className="shadow-xl rounded-xl">
              <MetricCard
                title={t('schoolAdminDashboard.activeClasses')}
                value={overview ? overview.totalClasses.toString() : '0'}
                icon={Users}
                trend={
                  overview
                    ? t('schoolAdminDashboard.classesDivisions', { classes: overview.totalClasses, divisions: overview.totalDivisions })
                    : ''
                }
                variant="violet"
              />
            </Card>

            <Card className="shadow-xl rounded-xl">
              <MetricCard
                title={t('schoolAdminDashboard.idsGenerated')}
                value={overview ? formatNumber(overview.idsGenerated) : '0'}
                icon={CheckCircle}
                trend={overview ? t('schoolAdminDashboard.completionRate', { rate: overview.completionRate }) : t('schoolAdminDashboard.completionRate', { rate: 0 })}
                trendUp={true}
                variant="violet"
              />
            </Card>

            {/* <Card className="shadow-xl rounded-xl">
              <MetricCard
                title="Credit Balance"
                value={overview ? formatNumber(overview.creditBalance) : '0'}
                icon={CreditCard}
                trend="Remaining credits"
              />
            </Card> */}
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="border shadow-md rounded-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {t('schoolAdminDashboard.classWiseIdStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  {classData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="class" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="students" fill="#8b5cf6" name={t('schoolAdminDashboard.totalStudentsBar')} />
                        <Bar dataKey="completed" fill="#10b981" name={t('schoolAdminDashboard.idsGeneratedBar')} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      {t('schoolAdminDashboard.noDataAvailable')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-md rounded-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{t('schoolAdminDashboard.quickStats')}</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {quickStats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">{t('schoolAdminDashboard.pendingApprovals')}</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        {quickStats.pendingApprovals} {t('schoolAdminDashboard.forms')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">{t('schoolAdminDashboard.formsSubmitted')}</span>
                      <Badge className="bg-violet-100 text-violet-800">
                        {formatNumber(quickStats.formsSubmitted)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">{t('schoolAdminDashboard.completedThisWeek')}</span>
                      <Badge className="bg-green-100 text-green-800">
                        {formatNumber(quickStats.completedThisWeek)} {t('schoolAdminDashboard.ids')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">{t('schoolAdminDashboard.activeTeachers')}</span>
                      <span>{quickStats.activeTeachers}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">{t('schoolAdminDashboard.completionRateStat')}</span>
                      <span className="text-green-600">{quickStats.completionRate}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    {t('schoolAdminDashboard.noDataAvailable')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t('schoolAdminDashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-10">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('schoolAdminDashboard.activity')}</TableHead>
                        <TableHead>{t('schoolAdminDashboard.teacher')}</TableHead>
                        <TableHead>{t('schoolAdminDashboard.count')}</TableHead>
                        <TableHead>{t('schoolAdminDashboard.status')}</TableHead>
                        <TableHead>{t('schoolAdminDashboard.time')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity.length > 0 ? (
                        recentActivity.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-gray-900 truncate" title={item.activity}>
                              {item.activity}
                            </TableCell>
                            <TableCell className="text-gray-600">{item.teacher}</TableCell>
                            <TableCell className="text-gray-600">{item.count} {t('schoolAdminDashboard.students')}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  item.status === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'Pending Approval'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-violet-100 text-violet-800'
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{item.time}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            {t('schoolAdminDashboard.noRecentActivity')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Notification Modal */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Send className="w-5 h-5 text-violet-500" />
              {t('schoolAdminDashboard.sendNotification')}
            </DialogTitle>
            {/* <DialogDescription>
              Send a message to your trust administrator.
            </DialogDescription> */}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">{t('schoolAdminDashboard.message')}</Label>
              <Textarea
                id="message"
                placeholder={t('schoolAdminDashboard.messagePlaceholder')}
                className="min-h-[150px] resize-none"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNotificationModalOpen(false)}
              disabled={sendingNotification}
            >
              {t('schoolAdminDashboard.cancel')}
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={sendingNotification || !notificationMessage.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {sendingNotification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('schoolAdminDashboard.sending')}
                </>
              ) : (
                t('schoolAdminDashboard.sendNotificationBtn')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
