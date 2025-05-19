
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from "@/components/shared/PageHeader";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, CheckCircle, XCircle, Download as DownloadIcon, Edit3, AlertTriangle, CalendarClock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isValid } from 'date-fns';
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
  { id: "jamb", label: "JAMB" },
  { id: "waec", label: "WAEC/SSCE" },
  { id: "post_utme", label: "Post-UTME" },
];

const paymentMethodFiltersData = [
    { id: "all", label: "All Methods" },
    { id: "cash", label: "Cash Payments" },
    { id: "transfer", label: "Bank Transfers" },
];


export default function PaymentManagementPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isPaymentDialogOpem, setIsPaymentDialogOpem] = useState(false);
  const [currentStudentForDialog, setCurrentStudentForDialog] = useState<Student | null>(null);
  const [dialogAmountPaid, setDialogAmountPaid] = useState<string>("");
  const [dialogSenderName, setDialogSenderName] = useState<string>("");

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
    } catch (error: any) {
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
    if (isClient) sessionStorage.setItem("isAdminAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (isClient) sessionStorage.removeItem("isAdminAuthenticated");
    setAllStudents([]);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const updatePaymentGeneric = async (studentId: string, payload: any, successTitle: string, successDescription: string) => {
    if (!isClient) return;
    setIsUpdatingPayment(true);
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.updatedStudent) {
        throw new Error(result.details || result.error || `Failed to update: ${response.statusText}`);
      }
      setAllStudents(prevStudents =>
        prevStudents.map(s => (s.id === studentId ? { ...s, ...result.updatedStudent } : s))
      );
      toast({ title: successTitle, description: successDescription });
      return true;
    } catch (error: any) {
      console.error("Error updating payment:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleApprovePayment = (studentId: string) => {
    updatePaymentGeneric(studentId, { paymentStatus: 'approved' }, "Payment Approved", "Student payment approved and dates updated.");
  };

  const handleRejectPayment = (studentId: string) => {
    updatePaymentGeneric(studentId, { paymentStatus: 'rejected' }, "Payment Rejected", "Student payment has been rejected.");
  };

  const openAddDetailsDialog = (student: Student) => {
    setCurrentStudentForDialog(student);
    setDialogAmountPaid(student.amountDue > 0 ? student.amountDue.toString() : "");
    setDialogSenderName(student.senderName || "");
    setIsPaymentDialogOpem(true);
  };

  const handleSubmitAddDetailsDialog = async () => {
    if (!currentStudentForDialog) return;
    const amount = parseFloat(dialogAmountPaid);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" }); return;
    }
    if (!dialogSenderName.trim()) {
      toast({ title: "Sender Name Required", description: "Please enter sender's name.", variant: "destructive" }); return;
    }
    const success = await updatePaymentGeneric(
      currentStudentForDialog.id,
      { paymentStatus: 'pending_verification', amountDue: amount, senderName: dialogSenderName.trim() },
      "Payment Details Submitted",
      "Student payment details submitted for verification."
    );
    if (success) {
      setIsPaymentDialogOpem(false);
      setCurrentStudentForDialog(null);
      setDialogAmountPaid("");
      setDialogSenderName("");
    }
  };
  
  const openMonthlyRenewalDialog = (student: Student) => {
    setCurrentStudentForDialog(student);
    setIsMonthlyRenewalDialogOpem(true);
  };

  const handleRecordMonthlyPayment = async () => {
    if (!currentStudentForDialog) return;
    const success = await updatePaymentGeneric(
      currentStudentForDialog.id,
      { isMonthlyRenewal: true, amountDue: 8000 },
      "Monthly Payment Recorded",
      `₦8000 payment recorded for ${currentStudentForDialog.fullName}.`
    );
    if (success) {
      setIsMonthlyRenewalDialogOpem(false);
      setCurrentStudentForDialog(null);
    }
  };


  const paymentStatusFilters = [
    { id: "all", label: "All Statuses" },
    { id: "pending_verification", label: "Pending Verification" },
    { id: "pending_payment", label: "Pending Payment" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  const filteredStudentsForPayment = useMemo(() => {
    return allStudents.filter(student => {
      const matchesStatus = filterPaymentStatus === "all" || student.paymentStatus === filterPaymentStatus;
      
      const matchesPaymentMethod = () => {
        if (filterPaymentMethod === "all") return true;
        const sender = (student.senderName || "").toLowerCase();
        if (filterPaymentMethod === "cash") {
          return sender.includes("cash") || sender.includes("pos") || sender.includes("counter");
        }
        if (filterPaymentMethod === "transfer") {
          return sender !== "" && !(sender.includes("cash") || sender.includes("pos") || sender.includes("counter"));
        }
        return true;
      };

      const matchesSearchTerm = searchTerm === "" || 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm);
      
      return matchesStatus && matchesSearchTerm && matchesPaymentMethod();
    }).sort((a,b) => {
      const dateA = a.lastPaymentDate ? parseISO(a.lastPaymentDate) : (a.registrationDate || new Date(0));
      const dateB = b.lastPaymentDate ? parseISO(b.lastPaymentDate) : (b.registrationDate || new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
  }, [allStudents, filterPaymentStatus, filterPaymentMethod, searchTerm]);

  const getPaymentStatusBadgeVariant = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'approved': return 'default'; 
      case 'pending_verification': return 'secondary'; 
      case 'rejected': return 'destructive'; 
      case 'pending_payment': return 'outline'; 
      default: return 'outline';
    }
  };
  
  const handleDownloadCSVPayments = () => {
    if (filteredStudentsForPayment.length === 0) {
      toast({ title: "No Data", description: "No payment data to download with current filters.", variant: "default" });
      return;
    }

    const headers = [
      'Student Name', 'Email', 'Program(s)', 'Last Amount Paid (₦)', 'Sender Name',
      'Payment Status', 'Date Registered', 'Last Payment Date', 'Next Payment Due Date'
    ];
    const csvRows = [headers.join(',')];

    filteredStudentsForPayment.forEach(student => {
      const programs = student.selectedSubjects.map(s => programFiltersData.find(p => p.id === s)?.label || s).join('; ');
      const paymentStatusText = student.paymentStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const lastPaymentDateText = student.lastPaymentDate && isValid(parseISO(student.lastPaymentDate)) ? format(parseISO(student.lastPaymentDate), 'yyyy-MM-dd') : 'N/A';
      const nextPaymentDueDateText = student.nextPaymentDueDate && isValid(parseISO(student.nextPaymentDueDate)) ? format(parseISO(student.nextPaymentDueDate), 'yyyy-MM-dd') : 'N/A';
      
      const row = [
        `"${student.fullName}"`,
        `"${student.email}"`,
        `"${programs}"`,
        student.amountDue.toLocaleString(),
        `"${student.senderName || 'N/A'}"`,
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
      link.setAttribute("download", "student_payments_renewals.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: "Student payments CSV is being downloaded." });
    } else {
      toast({ title: "Download Failed", description: "Your browser does not support this feature.", variant: "destructive" });
    }
  };

  const resetFilters = () => {
    setFilterPaymentStatus("all");
    setFilterPaymentMethod("all");
    setSearchTerm("");
  };

  if (!isClient) {
    return (
      <div>
        <PageHeader title="Payment Management" description="Verify payments and record monthly renewals." />
        <div className="container mx-auto py-10 text-center">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onAuthenticated={handleSuccessfulLogin} pageTitle="Payment Management" />;
  }
  
  return (
    <div>
      <PageHeader title="Payment Management & Renewals" />
      <section className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin" passHref>
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-primary text-xl">Manage Student Payments</CardTitle>
            <CardDescription>Review initial payments, record monthly renewals, or add payment details for students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <Label htmlFor="statusFilter" className="text-sm font-medium">Filter by Payment Status</Label>
                        <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                            <SelectTrigger id="statusFilter" className="mt-1 w-full"><SelectValue placeholder="Select Status" /></SelectTrigger>
                            <SelectContent>{paymentStatusFilters.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="methodFilter" className="text-sm font-medium">Filter by Payment Method (Inferred)</Label>
                        <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                            <SelectTrigger id="methodFilter" className="mt-1 w-full"><SelectValue placeholder="Select Method" /></SelectTrigger>
                            <SelectContent>{paymentMethodFiltersData.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="searchTermPayments" className="text-sm font-medium">Search Student</Label>
                        <Input 
                            id="searchTermPayments"
                            type="text"
                            placeholder="Name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 w-full"
                        />
                    </div>
                     <div className="md:col-span-3 flex justify-between items-center mt-2">
                       <Button variant="outline" onClick={handleDownloadCSVPayments} className="text-sm">
                         <DownloadIcon className="mr-2 h-4 w-4" /> Download CSV
                       </Button>
                       <Button variant="ghost" onClick={resetFilters} className="text-sm">
                        <XCircle className="mr-2 h-4 w-4" /> Reset Filters
                      </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
              <p className="text-center py-8">Loading payment data...</p>
            ) : filteredStudentsForPayment.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">No payments match the current filters, or no payment information has been submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Program(s)</TableHead>
                      <TableHead>Last Paid (₦)</TableHead>
                       <TableHead>Sender Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudentsForPayment.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.selectedSubjects.map(s => programFiltersData.find(p => p.id ===s)?.label || s).join(', ')}</TableCell>
                        <TableCell>{student.amountDue > 0 ? student.amountDue.toLocaleString() : "N/A"}</TableCell>
                        <TableCell className="text-center">
                          {student.senderName ? (
                            <span className="text-sm">{student.senderName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No Sender Name</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusBadgeVariant(student.paymentStatus)} className="capitalize">
                            {student.paymentStatus.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.lastPaymentDate && isValid(parseISO(student.lastPaymentDate)) ? format(parseISO(student.lastPaymentDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                        <TableCell>{student.nextPaymentDueDate && isValid(parseISO(student.nextPaymentDueDate)) ? format(parseISO(student.nextPaymentDueDate), 'dd MMM yyyy') : <Badge variant="outline">Not Set</Badge>}</TableCell>
                        <TableCell className="text-center space-y-1">
                          {student.paymentStatus === 'pending_verification' && (
                            <div className="flex gap-2 justify-center">
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="bg-green-600 hover:bg-green-700" 
                                onClick={() => handleApprovePayment(student.id)}
                                disabled={isUpdatingPayment}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleRejectPayment(student.id)}
                                disabled={isUpdatingPayment}
                              >
                                <XCircle className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          )}
                           {student.paymentStatus === 'pending_payment' && (
                             <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openAddDetailsDialog(student)}
                                disabled={isUpdatingPayment}
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
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                <CalendarClock className="mr-1 h-4 w-4" /> Record Monthly
                              </Button>
                          )}
                          {student.paymentStatus === 'rejected' && (
                             <span className="text-xs text-muted-foreground">Payment Rejected</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
                Displaying {filteredStudentsForPayment.length} payment records.
            </p>
          </CardContent>
        </Card>

        {/* Dialog for Adding/Editing Payment Details */}
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
                        <Label htmlFor="dialogAmountPaid">Amount Paid (₦)</Label>
                        <Input 
                            id="dialogAmountPaid" 
                            type="number" 
                            value={dialogAmountPaid}
                            onChange={(e) => setDialogAmountPaid(e.target.value)}
                            placeholder="e.g. 8000"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="dialogSenderName">Sender Name</Label>
                        <Input 
                            id="dialogSenderName" 
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
                        onClick={handleSubmitAddDetailsDialog} 
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
                     <p>Current Next Due Date: {currentStudentForDialog?.nextPaymentDueDate && isValid(parseISO(currentStudentForDialog.nextPaymentDueDate)) ? format(parseISO(currentStudentForDialog.nextPaymentDueDate), 'dd MMM yyyy') : 'N/A'}</p>
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
