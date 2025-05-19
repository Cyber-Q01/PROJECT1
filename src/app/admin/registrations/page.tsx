
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from "@/components/shared/PageHeader";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, ArrowUpDown, XCircle, Download, Edit3, AlertTriangle, CalendarClock } from "lucide-react"; 
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isValid } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Student {
  id: string; 
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Date; // Changed to Date
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  registrationDate: Date; // Changed to Date
  amountDue: number; 
  senderName?: string | null; 
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
  lastPaymentDate?: string | null; // ISO string
  nextPaymentDueDate?: string | null; // ISO string
}

const programFiltersData = [
  { id: "all", label: "All Programs" },
  { id: "jamb", label: "JAMB" },
  { id: "waec", label: "WAEC/SSCE" },
  { id: "post_utme", label: "Post-UTME" },
];

const classTimingFiltersData = [
    { id: "all", label: "All Timings" },
    { id: "morning", label: "Morning" },
    { id: "afternoon", label: "Afternoon" },
];

const paymentAmountFiltersData = [
  { id: "all", label: "All Payment Amounts" },
  { id: "less_than_4000", label: "Less than ₦4000" },
  { id: "4000_to_7999", label: "₦4000 - ₦7999" },
  { id: "equal_to_8000", label: "Full Payment (₦8000)" },
];

type SortableStudentKeys = keyof Pick<Student, 'fullName' | 'email' | 'phone' | 'classTiming' | 'paymentStatus' | 'registrationDate' | 'amountDue' | 'dateOfBirth' | 'lastPaymentDate' | 'nextPaymentDueDate'> | 'selectedSubjects';


export default function RegistrationManagementPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterClassTiming, setFilterClassTiming] = useState<string>("all");
  const [filterPaymentRange, setFilterPaymentRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [sortConfig, setSortConfig] = useState<{ key: SortableStudentKeys | null; direction: 'ascending' | 'descending' }>({ key: 'registrationDate', direction: 'descending' });

  const [isPaymentDialogOpem, setIsPaymentDialogOpem] = useState(false);
  const [currentStudentForDialog, setCurrentStudentForDialog] = useState<Student | null>(null);
  const [dialogAmountPaid, setDialogAmountPaid] = useState<string>("");
  const [dialogSenderName, setDialogSenderName] = useState<string>("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const [isMonthlyRenewalDialogOpem, setIsMonthlyRenewalDialogOpem] = useState(false);


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdminAuthenticated") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchStudents = async () => {
    if (!isClient || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch students: ${response.statusText}`);
      }
      const data = await response.json();
      const loadedStudentsData: Student[] = data.students.map((s: any) => ({
        id: s._id || s.id, 
        fullName: s.fullName || 'N/A',
        email: s.email || 'N/A',
        phone: s.phone || 'N/A',
        address: s.address || 'N/A',
        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : new Date(0),
        selectedSubjects: Array.isArray(s.selectedSubjects) ? s.selectedSubjects : [],
        classTiming: s.classTiming === 'morning' || s.classTiming === 'afternoon' ? s.classTiming : 'morning',
        registrationDate: s.registrationDate ? new Date(s.registrationDate) : new Date(0),
        amountDue: typeof s.amountDue === 'number' ? s.amountDue : 0,
        senderName: s.senderName || null, 
        paymentStatus: s.paymentStatus || 'pending_payment',
        lastPaymentDate: s.lastPaymentDate || null,
        nextPaymentDueDate: s.nextPaymentDueDate || null,
      }));
      setAllStudents(loadedStudentsData);
    } catch (error: any)
     {
      console.error("Error loading students from API", error);
      toast({ title: "Error Loading Students", description: error.message || "Could not load student data.", variant: "destructive" });
      setAllStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isClient) {
      fetchStudents();
    }
  }, [isAuthenticated, isClient]);

  const handleSuccessfulLogin = () => {
    setIsAuthenticated(true);
    if (isClient) {
      sessionStorage.setItem("isAdminAuthenticated", "true");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (isClient) sessionStorage.removeItem("isAdminAuthenticated");
    setAllStudents([]);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  const requestSort = (key: SortableStudentKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableStudentKeys) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50 inline-block" />;
  };

  const filteredAndSortedStudents = useMemo(() => {
    let sortableStudents = [...allStudents];
    if (sortConfig.key !== null) {
      sortableStudents.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];

        if (sortConfig.key === 'lastPaymentDate' || sortConfig.key === 'nextPaymentDueDate') {
          // Handle null or invalid dates by pushing them to the end or beginning
          const aDate = aValue ? parseISO(aValue as string) : null;
          const bDate = bValue ? parseISO(bValue as string) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return sortConfig.direction === 'ascending' ? 1 : -1; // nulls last for ascending
          if (!bDate) return sortConfig.direction === 'ascending' ? -1 : 1; // nulls last for ascending
          aValue = aDate;
          bValue = bDate;
        }


        if (sortConfig.key === 'selectedSubjects') {
          const aSubjects = (aValue as string[]).join(', ');
          const bSubjects = (bValue as string[]).join(', ');
          if (aSubjects < bSubjects) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aSubjects > bSubjects) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === 'ascending' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
        }
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableStudents.filter(student => {
      const matchesProgram = filterProgram === "all" || (Array.isArray(student.selectedSubjects) && student.selectedSubjects.includes(filterProgram));
      const matchesClassTiming = filterClassTiming === "all" || student.classTiming === filterClassTiming;
      const matchesSearchTerm = searchTerm === "" || 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm);

      let matchesPaymentRange = true;
      if (filterPaymentRange === "less_than_4000") {
        matchesPaymentRange = student.amountDue < 4000;
      } else if (filterPaymentRange === "4000_to_7999") {
        matchesPaymentRange = student.amountDue >= 4000 && student.amountDue <= 7999;
      } else if (filterPaymentRange === "equal_to_8000") {
        matchesPaymentRange = student.amountDue === 8000;
      }
      
      return matchesProgram && matchesClassTiming && matchesPaymentRange && matchesSearchTerm;
    });
  }, [allStudents, sortConfig, filterProgram, filterClassTiming, filterPaymentRange, searchTerm]);

  const resetFiltersAndSort = () => {
    setFilterProgram("all");
    setFilterClassTiming("all");
    setFilterPaymentRange("all");
    setSearchTerm("");
    setSortConfig({ key: 'registrationDate', direction: 'descending' });
  };

  const handleDownloadCSVRegistrations = () => {
    if (filteredAndSortedStudents.length === 0) {
      toast({ title: "No Data", description: "No data to download with current filters.", variant: "default" });
      return;
    }

    const headers = [
      'Full Name', 'Email', 'Phone', 'Date of Birth', 'Program(s)', 
      'Class Timing', 'Amount Paid (₦)', 'Payment Status', 'Date Joined',
      'Last Payment Date', 'Next Payment Due Date'
    ];

    const csvRows = [headers.join(',')];

    filteredAndSortedStudents.forEach(student => {
      const programs = student.selectedSubjects.map(s => programFiltersData.find(p => p.id === s && p.id !== "all")?.label || s).join('; ');
      const paymentStatusText = student.paymentStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const classTimingText = student.classTiming.charAt(0).toUpperCase() + student.classTiming.slice(1);
      const lastPaymentDateText = student.lastPaymentDate ? format(parseISO(student.lastPaymentDate), 'yyyy-MM-dd') : 'N/A';
      const nextPaymentDueDateText = student.nextPaymentDueDate ? format(parseISO(student.nextPaymentDueDate), 'yyyy-MM-dd') : 'N/A';
      
      const row = [
        `"${student.fullName}"`,
        `"${student.email}"`,
        `"${student.phone}"`,
        student.dateOfBirth ? `"${format(student.dateOfBirth, 'yyyy-MM-dd')}"` : 'N/A',
        `"${programs}"`,
        `"${classTimingText}"`,
        student.amountDue.toLocaleString(),
        `"${paymentStatusText}"`,
        student.registrationDate ? `"${format(student.registrationDate, 'yyyy-MM-dd HH:mm')}"` : 'N/A',
        `"${lastPaymentDateText}"`,
        `"${nextPaymentDueDateText}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "student_registrations.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: "Student registrations CSV is being downloaded." });
    } else {
      toast({ title: "Download Failed", description: "Your browser does not support this feature.", variant: "destructive" });
    }
  };

  const openPaymentDetailsDialog = (student: Student) => {
    setCurrentStudentForDialog(student);
    setDialogAmountPaid(student.amountDue > 0 ? student.amountDue.toString() : ""); // Default to current amount if exists
    setDialogSenderName(student.senderName || "");
    setIsPaymentDialogOpem(true);
  };

  const submitPaymentDetailsForStudent = async (studentId: string, amount: number, senderNameText: string) => {
    if (!isClient) return;
    setIsUpdatingPayment(true);
    try {
      const payload = {
        paymentStatus: 'pending_verification' as const,
        amountDue: amount,
        senderName: senderNameText,
      };

      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.updatedStudent) {
        throw new Error(result.details || result.error || `Failed to update payment details: ${response.statusText}`);
      }

      setAllStudents(prevStudents =>
        prevStudents.map(s => (s.id === studentId ? { ...s, ...result.updatedStudent } : s))
      );
      
      toast({
        title: "Payment Details Submitted",
        description: `Student payment information successfully submitted for verification.`,
      });
      setIsPaymentDialogOpem(false); 
      setCurrentStudentForDialog(null); 
      setDialogAmountPaid(""); 
      setDialogSenderName(""); 

    } catch (error: any) {
      console.error("Error updating payment details:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update payment details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleSubmitPaymentDialog = () => {
    if (!currentStudentForDialog) return;
    const amount = parseFloat(dialogAmountPaid);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount paid.", variant: "destructive" });
      return;
    }
    if (!dialogSenderName.trim()) {
      toast({ title: "Sender Name Required", description: "Please enter the sender's name.", variant: "destructive" });
      return;
    }
    submitPaymentDetailsForStudent(currentStudentForDialog.id, amount, dialogSenderName.trim());
  };
  
  const openMonthlyRenewalDialog = (student: Student) => {
    setCurrentStudentForDialog(student);
    setIsMonthlyRenewalDialogOpem(true);
  };

  const handleRecordMonthlyPayment = async () => {
    if (!currentStudentForDialog) return;
    setIsUpdatingPayment(true);
    try {
      const payload = {
        isMonthlyRenewal: true,
        amountDue: 8000, // Standard monthly fee
        // senderName could be set to "Admin Recorded - Monthly" by the API
      };
      const response = await fetch(`/api/students/${currentStudentForDialog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.updatedStudent) {
        throw new Error(result.details || result.error || `Failed to record monthly payment.`);
      }
      setAllStudents(prev => prev.map(s => s.id === currentStudentForDialog.id ? { ...s, ...result.updatedStudent } : s));
      toast({ title: "Monthly Payment Recorded", description: `₦8000 payment recorded for ${currentStudentForDialog.fullName}.` });
      setIsMonthlyRenewalDialogOpem(false);
      setCurrentStudentForDialog(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingPayment(false);
    }
  };


  if (!isClient) {
    return (
      <div>
        <PageHeader title="Registration Management" description="Access the student management dashboard." />
        <div className="container mx-auto py-10 text-center">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onAuthenticated={handleSuccessfulLogin} pageTitle="Registration Management" />;
  }
  
  const getPaymentStatusBadgeVariant = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'approved': return 'default'; 
      case 'pending_verification': return 'secondary'; 
      case 'rejected': return 'destructive'; 
      case 'pending_payment': return 'outline'; 
      default: return 'outline';
    }
  };


  return (
    <div>
      <PageHeader title="Registration Management" />
      <section className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin" passHref>
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-primary text-xl">Student Roster</CardTitle>
            <CardDescription>View, filter, and sort registered students. You can also add payment details or record monthly renewals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="programFilter" className="text-sm font-medium">Filter by Program</Label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger id="programFilter" className="mt-1 w-full"><SelectValue placeholder="Select Program" /></SelectTrigger>
                    <SelectContent>{programFiltersData.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timingFilter" className="text-sm font-medium">Filter by Class Timing</Label>
                  <Select value={filterClassTiming} onValueChange={setFilterClassTiming}>
                    <SelectTrigger id="timingFilter" className="mt-1 w-full"><SelectValue placeholder="Select Timing" /></SelectTrigger>
                    <SelectContent>{classTimingFiltersData.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="paymentFilter" className="text-sm font-medium">Filter by Payment Amount</Label>
                  <Select value={filterPaymentRange} onValueChange={setFilterPaymentRange}>
                    <SelectTrigger id="paymentFilter" className="mt-1 w-full"><SelectValue placeholder="Select Payment Range" /></SelectTrigger>
                    <SelectContent>{paymentAmountFiltersData.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                    <Label htmlFor="searchTerm" className="text-sm font-medium">Search Student</Label>
                    <Input 
                        id="searchTerm"
                        type="text"
                        placeholder="Name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div className="col-span-full flex justify-between items-center mt-2">
                   <Button variant="outline" onClick={handleDownloadCSVRegistrations} className="text-sm">
                    <Download className="mr-2 h-4 w-4" /> Download CSV
                  </Button>
                   <Button variant="ghost" onClick={resetFiltersAndSort} className="text-sm">
                    <XCircle className="mr-2 h-4 w-4" /> Reset Filters & Sort
                  </Button>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <p className="text-center py-8">Loading students...</p>
            ) : filteredAndSortedStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No students match the current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {([
                        { key: 'fullName', label: 'Full Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'dateOfBirth', label: 'Date of Birth' },
                        { key: 'selectedSubjects', label: 'Program(s)' },
                        { key: 'classTiming', label: 'Class Timing' },
                        { key: 'amountDue', label: 'Last Paid (₦)' },
                        { key: 'paymentStatus', label: 'Payment Status' },
                        { key: 'registrationDate', label: 'Date Joined' },
                        { key: 'lastPaymentDate', label: 'Last Payment Date' },
                        { key: 'nextPaymentDueDate', label: 'Next Due Date' },
                      ] as { key: SortableStudentKeys; label: string }[]).map(col => (
                        <TableHead key={col.key} onClick={() => requestSort(col.key)} className="cursor-pointer hover:bg-muted/80 transition-colors">
                          {col.label}{getSortIndicator(col.key)}
                        </TableHead>
                      ))}
                       <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.dateOfBirth ? format(student.dateOfBirth, 'dd MMM yyyy') : 'N/A'}</TableCell>
                        <TableCell>{student.selectedSubjects.map(s => programFiltersData.find(p => p.id ===s && p.id !== "all")?.label || s).join(', ')}</TableCell>
                        <TableCell className="capitalize">{student.classTiming}</TableCell>
                        <TableCell>{student.amountDue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusBadgeVariant(student.paymentStatus)} className="capitalize">
                            {student.paymentStatus.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.registrationDate ? format(student.registrationDate, 'dd MMM yyyy, hh:mm a') : 'N/A'}</TableCell>
                        <TableCell>{student.lastPaymentDate ? format(parseISO(student.lastPaymentDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                        <TableCell>{student.nextPaymentDueDate ? format(parseISO(student.nextPaymentDueDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-center space-y-1">
                          {student.paymentStatus === 'pending_payment' && (
                             <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openPaymentDetailsDialog(student)}
                                disabled={isUpdatingPayment}
                                className="w-full"
                              >
                                <Edit3 className="mr-1 h-4 w-4" /> Add Details
                              </Button>
                          )}
                          {student.paymentStatus === 'approved' && (
                             <Button 
                                size="sm" 
                                variant="default" 
                                onClick={() => openMonthlyRenewalDialog(student)}
                                disabled={isUpdatingPayment}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <CalendarClock className="mr-1 h-4 w-4" /> Record Monthly
                              </Button>
                          )}
                          {(student.paymentStatus === 'rejected' || student.paymentStatus === 'pending_verification') && (
                             <span className="text-xs text-muted-foreground">No direct actions</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
             <p className="text-sm text-muted-foreground mt-4">
                Displaying {filteredAndSortedStudents.length} of {allStudents.length} students.
            </p>
          </CardContent>
        </Card>

        {/* Dialog for Adding Payment Details (for pending_payment) */}
        <Dialog open={isPaymentDialogOpem} onOpenChange={(isOpen) => { setIsPaymentDialogOpem(isOpen); if (!isOpen) setCurrentStudentForDialog(null); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Payment Details for {currentStudentForDialog?.fullName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Alert variant="default">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                           You are about to submit payment information for this student. This will move them to 'Pending Verification'.
                        </AlertDescription>
                    </Alert>
                    <div>
                        <Label htmlFor="dialogAmountPaidReg">Amount Paid (₦)</Label>
                        <Input 
                            id="dialogAmountPaidReg" 
                            type="number" 
                            value={dialogAmountPaid}
                            onChange={(e) => setDialogAmountPaid(e.target.value)}
                            placeholder="e.g. 8000"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="dialogSenderNameReg">Sender Name</Label>
                        <Input 
                            id="dialogSenderNameReg" 
                            type="text" 
                            value={dialogSenderName}
                            onChange={(e) => setDialogSenderName(e.target.value)}
                            placeholder="e.g. Cash Payment, Bank Transfer by John Doe"
                            className="mt-1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                        onClick={handleSubmitPaymentDialog} 
                        disabled={isUpdatingPayment || !dialogAmountPaid || parseFloat(dialogAmountPaid) <=0 || !dialogSenderName.trim()}
                    >
                        {isUpdatingPayment ? "Submitting..." : "Submit for Verification"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Dialog for Recording Monthly Payment Renewal */}
        <Dialog open={isMonthlyRenewalDialogOpem} onOpenChange={(isOpen) => { setIsMonthlyRenewalDialogOpem(isOpen); if (!isOpen) setCurrentStudentForDialog(null); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Monthly Payment for {currentStudentForDialog?.fullName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                           You are about to record a monthly payment of ₦8000 for this student. This will update their last payment date and next due date.
                        </AlertDescription>
                    </Alert>
                     <p>Current Next Due Date: {currentStudentForDialog?.nextPaymentDueDate ? format(parseISO(currentStudentForDialog.nextPaymentDueDate), 'dd MMM yyyy') : 'N/A'}</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                        onClick={handleRecordMonthlyPayment} 
                        disabled={isUpdatingPayment}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isUpdatingPayment ? "Recording..." : "Confirm ₦8000 Payment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </section>
    </div>
  );
}
