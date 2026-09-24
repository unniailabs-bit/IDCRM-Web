import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  MessageSquare,
  Clock,
  Loader2,
  Trash2,
  Pencil,
  Upload,
  FileIcon,
  X,
  Eye,
  FileText,
  Video as VideoIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { schoolDashboardApi, Notification } from '@/api/schoolDashboard';
import { useTranslation } from 'react-i18next';

export function Notifications() {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || ''))
      return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return 'video';
    if (['pdf'].includes(extension || '')) return 'pdf';
    return 'file';
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await schoolDashboardApi.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('notifications.toastLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      let response;
      if (editingNotification) {
        response = await schoolDashboardApi.updateNotification(editingNotification.id, formData);
      } else {
        response = await schoolDashboardApi.sendNotification(formData);
      }

      if (response.success) {
        toast.success(
          editingNotification
            ? t('notifications.toastUpdateSuccess')
            : t('notifications.toastSendSuccess')
        );
        setMessage('');
        setSelectedFile(null);
        setIsModalOpen(false);
        setEditingNotification(null);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error(t('notifications.toastSaveFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!window.confirm(t('notifications.confirmDelete'))) return;

    try {
      const response = await schoolDashboardApi.deleteNotification(id);
      if (response.success) {
        toast.success(t('notifications.toastDeleteSuccess'));
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('notifications.toastDeleteFailed'));
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('notifications.title')}</h1>
          <p className="text-gray-600">{t('notifications.subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingNotification(null);
            setMessage('');
            setSelectedFile(null);
            setIsModalOpen(true);
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white flex gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('notifications.sendNew')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('notifications.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notif) => (
                  <div key={notif._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-gray-800 font-medium leading-relaxed flex-1">
                            {notif.message}
                          </p>
                          {notif.media_url && (
                            <div className="mt-3">
                              {(() => {
                                const url = getImageUrl(notif.media_url);
                                const type = getFileType(notif.media_url);

                                if (type === 'image') {
                                  return (
                                    <img
                                      src={url}
                                      alt="Attachment"
                                      className="max-w-xs rounded-lg border border-gray-200 mb-2 max-h-40 object-contain cursor-pointer transition-opacity hover:opacity-90"
                                      onClick={() => setPreviewImage(url)}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  );
                                } else if (type === 'video') {
                                  return (
                                    <div
                                      className="max-w-xs w-full h-40 bg-gray-100 rounded-lg border border-gray-200 mb-2 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                      onClick={() => setPreviewImage(url)}
                                    >
                                      <VideoIcon className="w-12 h-12 text-gray-400 mb-2" />
                                      <span className="text-gray-500 font-medium">
                                        {t('notifications.clickToPlayVideo')}
                                      </span>
                                    </div>
                                  );
                                } else if (type === 'pdf') {
                                  return (
                                    <div
                                      className="max-w-xs w-full h-32 bg-gray-50 rounded-lg border border-gray-200 mb-2 flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors p-4"
                                      onClick={() => setPreviewImage(url)}
                                    >
                                      <FileText className="w-10 h-10 text-red-500" />
                                      <div className="text-left">
                                        <p className="font-medium text-gray-700">
                                          {t('notifications.pdfDocument')}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {t('notifications.clickToPreview')}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-2 text-blue-600"
                                  onClick={() => setPreviewImage(getImageUrl(notif.media_url!))}
                                >
                                  <Eye className="w-3 h-3" />
                                  {t('notifications.preview')}
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingNotification(notif);
                                setMessage(notif.message);
                                setSelectedFile(null);
                                setIsModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteNotification(notif.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 gap-4">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bell className="h-10 w-10 opacity-20" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {t('notifications.noNotificationsTitle')}
                  </h3>
                  <p className="text-sm">{t('notifications.noNotificationsSubtitle')}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* SEND / EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {editingNotification ? (
                <Pencil className="w-5 h-5 text-blue-600" />
              ) : (
                <Plus className="w-5 h-5 text-blue-600" />
              )}
              {editingNotification
                ? t('notifications.editNotification')
                : t('notifications.newNotification')}
            </DialogTitle>
            <DialogDescription>
              {editingNotification
                ? t('notifications.updateMessageBelow')
                : t('notifications.sentToAdmins')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">{t('notifications.messageLabel')}</Label>
              <Textarea
                id="message"
                placeholder={t('notifications.messagePlaceholder')}
                className="min-h-[150px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('notifications.attachment')}</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('notifications.uploadFile')}
              </Button>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
                  <FileIcon className="w-4 h-4 text-blue-500" />
                  <span className="max-w-[150px] truncate">{selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('notifications.cancel')}
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={sending || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingNotification
                    ? t('notifications.updating')
                    : t('notifications.sending')}
                </>
              ) : editingNotification ? (
                t('notifications.updateNotification')
              ) : (
                t('notifications.sendNotification')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          <div className="relative flex items-center justify-center w-full h-full min-h-[50vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {previewImage && (
              <>
                {getFileType(previewImage) === 'image' && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-md"
                  />
                )}
                {getFileType(previewImage) === 'video' && (
                  <video
                    src={previewImage}
                    controls
                    autoPlay
                    className="max-w-full max-h-[90vh] rounded-md outline-none"
                  />
                )}
                {getFileType(previewImage) === 'pdf' && (
                  <iframe
                    src={previewImage}
                    className="w-full h-[80vh] bg-white rounded-md"
                    title="PDF Preview"
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
