
"use client";

import { useState, useEffect, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ShieldAlert, ArrowLeft, CheckCircle, XCircle, Eye, Download as DownloadIcon } from "lucide-react"; // Renamed Download to DownloadIcon
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  registrationDate: Date;
  amountDue: number;
  paymentReceiptUrl?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

const ADMIN_USERNAME = "folorunshoa08@gmail.com";
const ADMIN_PASSWORD = "Adekunle";

const programFiltersData = [
  { id: "jamb", label: "JAMB" },
  { id: "waec", label: "WAEC/SSCE" },
  { id: "post_utme", label: "Post-UTME" },
  { id: "edu_consult", label: "Edu Consult" },
];


export default function PaymentManagementPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdminAuthenticated") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const loadStudents = () => {
    if (isClient) {
      setIsLoading(true);
      try {
        const storedRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]");
        const loadedStudentsData: Student[] = storedRegistrations.map((s: any, i: number) => ({
          id: s.id || `local-${Date.now()}-${i}`,
          fullName: s.fullName || 'N/A',
          email: s.email || 'N/A',
          phone: s.phone || 'N/A',
          address: s.address || 'N/A',
          dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : new Date(0),
          selectedSubjects: Array.isArray(s.selectedSubjects) ? s.selectedSubjects : [],
          classTiming: s.classTiming === 'morning' || s.classTiming === 'afternoon' ? s.classTiming : 'morning',
          registrationDate: s.registrationDate ? new Date(s.registrationDate) : new Date(0),
          amountDue: typeof s.amountDue === 'number' ? s.amountDue : 0,
          paymentReceiptUrl: s.paymentReceiptUrl || null,
          paymentStatus: s.paymentStatus || 'pending_payment',
        }));
        setAllStudents(loadedStudentsData);
      } catch (error) {
        console.error("Error loading students from localStorage", error);
        toast({ title: "Error", description: "Could not load student data.", variant: "destructive" });
        setAllStudents([]);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  useEffect(() => {
    if (isAuthenticated && isClient) {
      loadStudents();
    }
  }, [isAuthenticated, isClient, toast]);

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      if (isClient) sessionStorage.setItem("isAdminAuthenticated", "true");
      setLoginError('');
      toast({ title: "Login Successful", description: "Welcome, Admin!" });
    } else {
      setLoginError("Invalid username or password.");
      toast({ title: "Login Failed", description: "Incorrect credentials.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (isClient) sessionStorage.removeItem("isAdminAuthenticated");
    setUsernameInput('');
    setPasswordInput('');
    setAllStudents([]);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const updatePaymentStatus = (studentId: string, newStatus: Student['paymentStatus']) => {
    if (!isClient) return;
    try {
      const existingRegistrations: Student[] = JSON.parse(localStorage.getItem("registrations") || "[]");
      const updatedRegistrations = existingRegistrations.map(reg =>
        reg.id === studentId ? { ...reg, paymentStatus: newStatus } : reg
      );
      localStorage.setItem("registrations", JSON.stringify(updatedRegistrations));
      setAllStudents(prevStudents => prevStudents.map(s => s.id === studentId ? { ...s, paymentStatus: newStatus } : s));
      toast({ title: "Payment Status Updated", description: `Student ${studentId}'s payment status changed to ${newStatus.replace('_', ' ')}.` });
    } catch (error) {
      console.error("Error updating payment status", error);
      toast({ title: "Update Error", description: "Could not update payment status.", variant: "destructive" });
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
      const matchesSearchTerm = searchTerm === "" || 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm);
      // For this tab, we primarily care about students with receipts or in verification/payment stages.
      // If showing 'all' or 'pending_payment', include those without receipts yet.
      // Otherwise, they must have a receipt.
      const hasReceiptOrRelevantStatus = student.paymentReceiptUrl || 
                                         filterPaymentStatus === "all" || 
                                         filterPaymentStatus === "pending_payment" ||
                                         student.paymentStatus === 'pending_verification';
                                         
      return matchesStatus && matchesSearchTerm && hasReceiptOrRelevantStatus;
    }).sort((a,b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
  }, [allStudents, filterPaymentStatus, searchTerm]);

  const getPaymentStatusBadgeVariant = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'approved': return 'default'; 
      case 'pending_verification': return 'secondary'; 
      case 'rejected': return 'destructive'; 
      case 'pending_payment': return 'outline'; 
      default: return 'outline';
    }
  };
  
  const handleDownloadReceiptImage = (receiptUrl: string, studentName: string) => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    // Guess extension or use a generic one. PNG is common for screenshots.
    const extension = receiptUrl.split('.').pop()?.split(';')[0] || 'png';
    link.download = `receipt_${studentName.replace(/\s+/g, '_')}.${extension}`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up blob URL if it was one
    toast({ title: "Receipt Downloaded", description: `Receipt for ${studentName} started downloading.` });
  };

  const handleDownloadCSVPayments = () => {
    if (filteredStudentsForPayment.length === 0) {
      toast({ title: "No Data", description: "No payment data to download with current filters.", variant: "default" });
      return;
    }

    const headers = [
      'Student Name', 'Email', 'Program(s)', 'Amount Paid (₦)', 
      'Date Registered', 'Payment Status'
    ];
    const csvRows = [headers.join(',')];

    filteredStudentsForPayment.forEach(student => {
      const programs = student.selectedSubjects.map(s => programFiltersData.find(p => p.id === s)?.label || s).join('; ');
      const paymentStatusText = student.paymentStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const row = [
        `"${student.fullName}"`,
        `"${student.email}"`,
        `"${programs}"`,
        student.amountDue.toString(),
        student.registrationDate ? `"${format(student.registrationDate, 'yyyy-MM-dd HH:mm')}"` : 'N/A',
        `"${paymentStatusText}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "student_payments.csv");
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


  if (!isClient) {
    return (
      <div>
        <PageHeader title="Admin Login" description="Access the student management dashboard." />
        <div className="container mx-auto py-10 text-center">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title="Admin Login" description="Access the student management dashboard." />
        <section className="container mx-auto py-10">
          <Card className="max-w-md mx-auto shadow-xl">
            <CardHeader><CardTitle className="text-xl text-primary">Admin Panel Login</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div><Label htmlFor="username">Username (Email)</Label><Input id="username" type="email" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="mt-1" required /></div>
                <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="mt-1" required /></div>
                {loginError && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Login Error</AlertTitle><AlertDescription>{loginError}</AlertDescription></Alert>}
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Login</Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader title="Payment Management" />
      <section className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin" passHref>
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-primary text-xl">Verify Student Payments</CardTitle>
            <CardDescription>Review uploaded payment receipts and approve or reject them.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <Label htmlFor="statusFilter" className="text-sm font-medium">Filter by Payment Status</Label>
                        <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                            <SelectTrigger id="statusFilter" className="mt-1 w-full"><SelectValue placeholder="Select Status" /></SelectTrigger>
                            <SelectContent>{paymentStatusFilters.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
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
                     <div className="col-span-full flex justify-between items-center mt-2">
                       <Button variant="outline" onClick={handleDownloadCSVPayments} className="text-sm">
                         <DownloadIcon className="mr-2 h-4 w-4" /> Download CSV
                       </Button>
                       <Button variant="ghost" onClick={() => {setFilterPaymentStatus("all"); setSearchTerm("");}} className="text-sm">
                        <XCircle className="mr-2 h-4 w-4" /> Reset Filters
                      </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
              <p>Loading payment data...</p>
            ) : filteredStudentsForPayment.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">No payments match the current filters, or no receipts have been uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Program(s)</TableHead>
                      <TableHead>Amount Paid (₦)</TableHead>
                      <TableHead>Date Registered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Receipt</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudentsForPayment.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.selectedSubjects.map(s => programFiltersData.find(p => p.id ===s)?.label || s).join(', ')}</TableCell>
                        <TableCell>{student.amountDue.toLocaleString()}</TableCell>
                        <TableCell>{student.registrationDate ? format(student.registrationDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusBadgeVariant(student.paymentStatus)} className="capitalize">
                            {student.paymentStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {student.paymentReceiptUrl ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> View</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-xl">
                                <DialogHeader>
                                  <DialogTitle>Payment Receipt: {student.fullName}</DialogTitle>
                                </DialogHeader>
                                <div className="my-4">
                                  <Image src={student.paymentReceiptUrl} alt={`Receipt for ${student.fullName}`} width={500} height={700} className="rounded-md object-contain max-h-[70vh] w-auto mx-auto" />
                                </div>
                                <div className="flex justify-end gap-2">
                                   <Button variant="outline" onClick={() => handleDownloadReceiptImage(student.paymentReceiptUrl!, student.fullName)}>
                                        <DownloadIcon className="mr-2 h-4 w-4" /> Download Image
                                    </Button>
                                  <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-xs text-muted-foreground">No Receipt</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.paymentStatus === 'pending_verification' && (
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => updatePaymentStatus(student.id, 'approved')}>
                                <CheckCircle className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => updatePaymentStatus(student.id, 'rejected')}>
                                <XCircle className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          )}
                          {(student.paymentStatus === 'approved' || student.paymentStatus === 'rejected') && (
                             <span className="text-xs text-muted-foreground">Verified</span>
                          )}
                          {student.paymentStatus === 'pending_payment' && (
                             <span className="text-xs text-muted-foreground">Awaiting Receipt</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
                Displaying {filteredStudentsForPayment.length} payments.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Helper function to get tailwind class names (cn) - Not used in this component
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

