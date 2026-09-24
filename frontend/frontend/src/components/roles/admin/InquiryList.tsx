import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { inquiryService, Inquiry } from '@/api/platform_admin/inquiryService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Mail,
    Phone,
    User,
    Calendar,
    Eye,
    Search,
    MessageSquare,
    ArrowRight,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function InquiryList() {
    const { t } = useTranslation();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const response = await inquiryService.getInquiries(page, limit);
            if (response.success) {
                setInquiries(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(t('inquiries.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [page]);

    const filteredInquiries = inquiries.filter(inquiry =>
        inquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && inquiries.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        {t('inquiries.title')}
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium opacity-80">
                        {t('inquiries.subtitle')}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                            placeholder="Search inquiries..."
                            className="pl-10 w-full md:w-80 h-11 bg-white border-slate-200 shadow-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchInquiries}
                        disabled={loading}
                        className="h-11 w-11 shrink-0 bg-white shadow-sm border-slate-200 hover:bg-slate-50 transition-all rounded-xl hover:rotate-180 duration-500"
                    >
                        <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-blue-900/5 overflow-hidden bg-white/90 backdrop-blur-xl rounded-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                                <TableRow>
                                    <TableHead className="py-6 px-6 font-bold text-slate-800 uppercase tracking-wider text-xs">
                                        {t('inquiries.fullName')}
                                    </TableHead>
                                    <TableHead className="py-6 px-6 font-bold text-slate-800 uppercase tracking-wider text-xs">
                                        {t('inquiries.email')}
                                    </TableHead>
                                    <TableHead className="py-6 px-6 font-bold text-slate-800 uppercase tracking-wider text-xs">
                                        {t('inquiries.phoneNumber')}
                                    </TableHead>
                                    <TableHead className="py-6 px-6 font-bold text-slate-800 uppercase tracking-wider text-xs">
                                        {t('inquiries.date')}
                                    </TableHead>
                                    <TableHead className="py-6 px-6 font-bold text-slate-800 uppercase tracking-wider text-xs text-right">
                                        {t('inquiries.actions')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInquiries.length > 0 ? (
                                    filteredInquiries.map((inquiry, index) => (
                                        <TableRow
                                            key={inquiry.id}
                                            className={`hover:bg-primary/5 transition-all duration-300 border-b border-slate-50 group ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                        >
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-4">

                                                    <div>
                                                        <span className="font-bold text-slate-900 block group-hover:text-primary transition-colors">
                                                            {inquiry.fullName}
                                                        </span>

                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <span>{inquiry.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <span>{inquiry.phoneNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <span>{formatDate(inquiry.createdAt)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6 text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedInquiry(inquiry)}
                                                            className="h-10 px-4 rounded-xl hover:bg-primary  transition-all group/btn shadow-hover"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                                                            {t('inquiries.viewMessage')}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-xl border-none shadow-2xl p-0 overflow-hidden rounded-[2rem]">
                                                        <div className="bg-white p-8">
                                                            <div className="flex items-center justify-between mb-8">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                                        <MessageSquare className="w-6 h-6" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                                                            Message Details
                                                                        </h3>
                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                            <p className="text-sm text-slate-500 font-semibold">
                                                                                Sent by {inquiry.fullName}
                                                                            </p>
                                                                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                                                    <Mail className="w-3 h-3 text-primary/60" />
                                                                                    {inquiry.email}
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                                                    <Phone className="w-3 h-3 text-primary/60" />
                                                                                    {inquiry.phoneNumber}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                                    {formatDate(inquiry.createdAt).split(',')[0]}
                                                                </span>
                                                            </div>

                                                            <div className="relative p-10 bg-gradient-to-br from-slate-50 to-white rounded-[1.5rem] border border-slate-100 shadow-inner">

                                                                <div className="relative z-10 text-slate-700 text-xl font-medium leading-relaxed text-center">
                                                                    {inquiry.message}
                                                                </div>
                                                            </div>


                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-[400px] text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                                    <MessageSquare className="w-12 h-12 text-slate-300" />
                                                </div>
                                                <p className="text-2xl font-bold text-slate-800">{t('inquiries.noInquiries')}</p>
                                                <p className="text-slate-400 mt-2">When people contact you, they'll show up here.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50">
                <p className="text-sm font-bold text-slate-500">
                    Showing <span className="text-primary">{(page - 1) * limit + 1}</span> to <span className="text-primary">{Math.min(page * limit, totalPages * limit)}</span> of <span className="text-primary">{totalPages * limit}+</span> entries
                </p>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="h-10 px-4 bg-white border-slate-200 shadow-sm hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 transition-all rounded-xl font-bold group"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Prev
                    </Button>

                    <div className="flex items-center gap-2 hidden md:flex">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = page;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (page <= 3) pageNum = i + 1;
                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = page - 2 + i;

                            return (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPage(pageNum)}
                                    className={`w-10 h-10 p-0 rounded-xl font-bold transition-all duration-300 ${page === pageNum
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
                                        }`}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="h-10 px-4 bg-white border-slate-200 shadow-sm hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 transition-all rounded-xl font-bold group"
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
