
"use client"; 
import { useState, useEffect, FormEvent, useMemo } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, UserCircle2, CheckCircle, XCircle, Eye, ShieldAlert, BadgeDollarSign, Clock, ThumbsUp, ThumbsDown, ListChecks, Banknote, ArrowUpDown, CalendarDays, Filter } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { format } from 'date-fns';

const programFilters = [
  { id: "all", label: "All Programs" },
  { id: "jamb", label: "JAMB" },
  { id: "waec", label: "WAEC/SSCE" },
  { id: "post_utme", label: "Post-UTME" },
  { id: "jss", label: "JSS" },
];

const paymentAmountFilters = [
  { id: "all", label: "All Payment Amounts" },
  { id: "less_than_4000", label: "Less than ₦4000" },
  { id: "half_plus", label: "₦4000 - ₦7999" },
  { id: "full_8000", label: "Full Payment (₦8000)" },
];

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

type SortKey = keyof Student | null;
type SortDirection = 'ascending' | 'descending';

const ADMIN_USERNAME = "folorunshoa08@gmail.com";
const ADMIN_PASSWORD = "Adekunle"; 

export default function AdminPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'registrationDate', direction: 'descending' });
  
  const [filterClassTiming, setFilterClassTiming] = useState<string>('all'); 
  const [filterProgram, setFilterProgram] = useState<string>('all'); 
  const [filterPaymentRange, setFilterPaymentRange] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
        if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
            setIsAuthenticated(true);
        }
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
  }, [isAuthenticated, isClient]);

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      if (isClient) {
        sessionStorage.setItem("isAdminAuthenticated", "true"); 
      }
      setLoginError('');
      toast({ title: "Login Successful", description: "Welcome, Admin!" });
    } else {
      setLoginError("Invalid username or password.");
      toast({ title: "Login Failed", description: "Incorrect credentials.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (isClient) {
      sessionStorage.removeItem("isAdminAuthenticated");
    }
    setUsernameInput('');
    setPasswordInput('');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const updateStudentPaymentStatus = (studentId: string, status: Student['paymentStatus']) => {
    if (!isClient) return;
    try {
      const existingRegistrations: Student[] = JSON.parse(localStorage.getItem("registrations") || "[]");
      const updatedRegistrations = existingRegistrations.map(reg =>
        reg.id === studentId ? { ...reg, paymentStatus: status } : reg
      );
      localStorage.setItem("registrations", JSON.stringify(updatedRegistrations));
      setAllStudents(prevStudents => prevStudents.map(s => s.id === studentId ? {...s, paymentStatus: status} : s)); 
      toast({
        title: "Payment Status Updated",
        description: `Student's payment marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error updating payment status in localStorage", error);
      toast({ title: "Update Failed", description: "Could not update payment status.", variant: "destructive" });
    }
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const filteredAndSortedStudents = useMemo(() => {
    let sortableStudents = [...allStudents];

    if (filterClassTiming !== 'all') {
      sortableStudents = sortableStudents.filter(student => student.classTiming === filterClassTiming);
    }
    if (filterProgram !== 'all') {
      sortableStudents = sortableStudents.filter(student => student.selectedSubjects.some(subject => subject.toLowerCase() === filterProgram.toLowerCase()));
    }
    if (filterPaymentRange !== 'all') {
      if (filterPaymentRange === 'less_than_4000') {
        sortableStudents = sortableStudents.filter(student => student.amountDue < 4000);
      } else if (filterPaymentRange === 'half_plus') {
        sortableStudents = sortableStudents.filter(student => student.amountDue >= 4000 && student.amountDue < 8000);
      } else if (filterPaymentRange === 'full_8000') {
        sortableStudents = sortableStudents.filter(student => student.amountDue === 8000);
      }
    }

    if (sortConfig.key !== null) {
      sortableStudents.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        let comparison = 0;
        if (valA instanceof Date && valB instanceof Date) {
          comparison = valA.getTime() - valB.getTime();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (Array.isArray(valA) && Array.isArray(valB)) { 
            comparison = valA.join(',').localeCompare(valB.join(','));
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableStudents;
  }, [allStudents, sortConfig, filterClassTiming, filterProgram, filterPaymentRange]);


  if (!isClient) {
     return (
        <div>
            <PageHeader title="Admin Dashboard" />
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
            <CardHeader>
              <CardTitle className="text-xl text-primary">Admin Panel Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="username">Username (Email)</Label>
                  <Input 
                    id="username" 
                    type="email" 
                    value={usernameInput} 
                    onChange={(e) => setUsernameInput(e.target.value)} 
                    className="mt-1" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    className="mt-1" 
                    required 
                  />
                </div>
                {loginError && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Login Error</AlertTitle>
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  const studentsForVerification = filteredAndSortedStudents.filter(s => s.paymentStatus !== 'pending_payment');

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Manage student registrations and verify payments."
      />
      <section className="container mx-auto py-10">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-primary">Student Administration</CardTitle>
              <CardDescription>Oversee student records and manage payment verifications.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="roster" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-2 mb-6">
                <TabsTrigger value="roster"><ListChecks className="mr-2 h-4 w-4" />Student Roster</TabsTrigger>
                <TabsTrigger value="verification"><Banknote className="mr-2 h-4 w-4" />Payment Verification</TabsTrigger>
              </TabsList>
              
              <TabsContent value="roster">
                <CardDescription className="mb-4">Comprehensive list of all registered students. Click headers to sort. Use filters for refined views.</CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-end">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="filterClassTiming" className="text-sm">Class Timing:</Label>
                    <Select value={filterClassTiming} onValueChange={setFilterClassTiming}>
                      <SelectTrigger id="filterClassTiming">
                        <SelectValue placeholder="Filter by class timing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Timings</SelectItem>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="filterProgram" className="text-sm">Program:</Label>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger id="filterProgram">
                        <SelectValue placeholder="Filter by program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programFilters.map(prog => (
                          <SelectItem key={prog.id} value={prog.id}>{prog.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="filterPaymentRange" className="text-sm">Payment Amount:</Label>
                    <Select value={filterPaymentRange} onValueChange={setFilterPaymentRange}>
                      <SelectTrigger id="filterPaymentRange">
                        <SelectValue placeholder="Filter by payment amount" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentAmountFilters.map(filter => (
                          <SelectItem key={filter.id} value={filter.id}>{filter.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 flex justify-start">
                     <Button variant="outline" size="sm" onClick={() => { setFilterClassTiming('all'); setFilterProgram('all'); setFilterPaymentRange('all'); setSortConfig({ key: 'registrationDate', direction: 'descending' }); }}>
                       <Filter className="mr-2 h-3 w-3" /> Reset Filters & Sort
                     </Button>
                  </div>
                </div>

                {isLoading ? (
                  <p>Loading student data...</p>
                ) : filteredAndSortedStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No student registrations match your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => requestSort('fullName')} className="cursor-pointer hover:bg-muted/50">Full Name {getSortIndicator('fullName')}</TableHead>
                          <TableHead onClick={() => requestSort('email')} className="cursor-pointer hover:bg-muted/50">Email {getSortIndicator('email')}</TableHead>
                          <TableHead onClick={() => requestSort('phone')} className="cursor-pointer hover:bg-muted/50">Phone {getSortIndicator('phone')}</TableHead>
                          <TableHead onClick={() => requestSort('dateOfBirth')} className="cursor-pointer hover:bg-muted/50">Date of Birth {getSortIndicator('dateOfBirth')}</TableHead>
                          <TableHead onClick={() => requestSort('selectedSubjects')} className="cursor-pointer hover:bg-muted/50">Programs {getSortIndicator('selectedSubjects')}</TableHead>
                          <TableHead onClick={() => requestSort('classTiming')} className="cursor-pointer hover:bg-muted/50">Class Timing {getSortIndicator('classTiming')}</TableHead>
                          <TableHead onClick={() => requestSort('registrationDate')} className="cursor-pointer hover:bg-muted/50">Date Joined {getSortIndicator('registrationDate')}</TableHead>
                          <TableHead onClick={() => requestSort('amountDue')} className="cursor-pointer hover:bg-muted/50">Amount Paid (₦) {getSortIndicator('amountDue')}</TableHead>
                          <TableHead onClick={() => requestSort('paymentStatus')} className="cursor-pointer hover:bg-muted/50">Payment Status {getSortIndicator('paymentStatus')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.fullName}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{student.phone}</TableCell>
                            <TableCell>{format(student.dateOfBirth, 'PP')}</TableCell>
                            <TableCell>{student.selectedSubjects.map(s => s.toUpperCase()).join(", ")}</TableCell>
                            <TableCell className="capitalize">{student.classTiming}</TableCell>
                            <TableCell>{format(student.registrationDate, 'PPp')}</TableCell>
                            <TableCell>₦{student.amountDue.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  student.paymentStatus === 'approved' ? 'default' :
                                  student.paymentStatus === 'rejected' ? 'destructive' :
                                  student.paymentStatus === 'pending_verification' ? 'secondary' :
                                  'outline'
                                }
                                className="capitalize whitespace-nowrap"
                              >
                                {student.paymentStatus === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                                {student.paymentStatus === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                                {student.paymentStatus === 'pending_verification' && <Clock className="mr-1 h-3 w-3" />}
                                {student.paymentStatus === 'pending_payment' && <BadgeDollarSign className="mr-1 h-3 w-3" />}
                                {student.paymentStatus.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="verification">
                <CardDescription className="mb-4">Review and manage student payment submissions.</CardDescription>
                {isLoading ? (
                  <p>Loading payment data...</p>
                ) : studentsForVerification.length === 0 ? (
                  <div className="text-center py-8">
                    <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payments are currently pending verification or processed based on current filters.</p>
                     <p className="text-sm text-muted-foreground mt-1">Payments awaiting verification will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Date Registered</TableHead>
                          <TableHead>Amount Paid (₦)</TableHead>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsForVerification.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.fullName}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{format(student.registrationDate, 'PP')}</TableCell>
                            <TableCell>₦{student.amountDue.toLocaleString()}</TableCell>
                            <TableCell>
                              {student.paymentReceiptUrl ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" /> View</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Payment Receipt: {student.fullName}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        <Image src={student.paymentReceiptUrl} alt={`Receipt for ${student.fullName}`} width={400} height={600} className="rounded-md mt-2 object-contain max-h-[70vh]" />
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Close</AlertDialogCancel>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <span className="text-muted-foreground text-xs">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  student.paymentStatus === 'approved' ? 'default' :
                                  student.paymentStatus === 'rejected' ? 'destructive' :
                                  student.paymentStatus === 'pending_verification' ? 'secondary' :
                                  'outline'
                                }
                                className="capitalize whitespace-nowrap"
                              >
                                {student.paymentStatus === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                                {student.paymentStatus === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                                {student.paymentStatus === 'pending_verification' && <Clock className="mr-1 h-3 w-3" />}
                                {student.paymentStatus.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="space-x-1 whitespace-nowrap">
                              {student.paymentStatus === 'pending_verification' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => updateStudentPaymentStatus(student.id, 'approved')}
                                  >
                                    <ThumbsUp className="mr-1 h-3 w-3" /> Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => updateStudentPaymentStatus(student.id, 'rejected')}
                                  >
                                     <ThumbsDown className="mr-1 h-3 w-3" /> Reject
                                  </Button>
                                </>
                              )}
                              {(student.paymentStatus === 'approved' || student.paymentStatus === 'rejected') && (
                                 <span className="text-xs text-muted-foreground italic">
                                  Actioned
                                 </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    