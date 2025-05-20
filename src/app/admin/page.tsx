
"use client"; 
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from "@/components/shared/PageHeader";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, Banknote as BanknoteIcon, FileText, Clock, ArrowRight, ListOrdered, CreditCard, CalendarDays } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isValid, getYear, getMonth, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const programFilters = [
  { id: "jamb", label: "JAMB" },
  { id: "waec", label: "WAEC/SSCE" },
  { id: "post_utme", label: "Post-UTME" },
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
  senderName?: string | null; 
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
  lastPaymentDate?: string | null; // ISO string
  nextPaymentDueDate?: string | null; // ISO string
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, className }) => {
  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i); // Current year and last 4 years


export default function AdminDashboardPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date())); // 0-indexed
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
        if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
            setIsAuthenticated(true);
        }
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
        dateOfBirth: s.dateOfBirth ? parseISO(s.dateOfBirth) : new Date(0),
        selectedSubjects: Array.isArray(s.selectedSubjects) ? s.selectedSubjects : [],
        classTiming: s.classTiming === 'morning' || s.classTiming === 'afternoon' ? s.classTiming : 'morning',
        registrationDate: s.registrationDate ? parseISO(s.registrationDate) : new Date(0),
        amountDue: typeof s.amountDue === 'number' ? s.amountDue : 0, 
        senderName: s.senderName || null, 
        paymentStatus: s.paymentStatus || 'pending_payment',
        lastPaymentDate: s.lastPaymentDate || null,
        nextPaymentDueDate: s.nextPaymentDueDate || null,
      }));
      setAllStudents(loadedStudentsData);
    } catch (error: any) {
      console.error("Error loading students from API", error);
      toast({ title: "Error Loading Students", description: error.message || "Could not load student data from the server.", variant: "destructive" });
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
    if (isClient) {
      sessionStorage.removeItem("isAdminAuthenticated");
    }
    setAllStudents([]); 
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const dashboardStats = useMemo(() => {
    if (!allStudents || allStudents.length === 0) {
      return {
        totalStudents: 0,
        totalRevenue: 0,
        totalRegistrations: 0,
        pendingPayments: 0,
        programDistribution: programFilters.map(p => ({ name: p.label, count: 0, percentage: 0 })),
      };
    }

    const totalStudents = allStudents.length;
    const totalRevenue = allStudents
      .filter(s => s.paymentStatus === 'approved') 
      .reduce((sum, s) => sum + s.amountDue, 0); 
    const totalRegistrations = totalStudents; 
    const pendingPayments = allStudents.filter(s => s.paymentStatus === 'pending_verification').length;

    const programDistribution = programFilters.map(progFilter => {
      const count = allStudents.filter(s => Array.isArray(s.selectedSubjects) && s.selectedSubjects.includes(progFilter.id)).length;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
      return { name: progFilter.label, count, percentage };
    });

    return { totalStudents, totalRevenue, totalRegistrations, pendingPayments, programDistribution };
  }, [allStudents]);

  const monthlyPaymentOverviewStudents = useMemo(() => {
    if (!allStudents || allStudents.length === 0) return [];

    const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth));

    return allStudents
      .filter(student => {
        if (student.paymentStatus !== 'approved') return false;
        
        const lastPaymentDate = student.lastPaymentDate ? parseISO(student.lastPaymentDate) : null;
        const nextPaymentDueDate = student.nextPaymentDueDate ? parseISO(student.nextPaymentDueDate) : null;

        const isLastPaymentInMonth = lastPaymentDate && isValid(lastPaymentDate) && isWithinInterval(lastPaymentDate, { start: startDate, end: endDate });
        const isNextDueInMonth = nextPaymentDueDate && isValid(nextPaymentDueDate) && isWithinInterval(nextPaymentDueDate, { start: startDate, end: endDate });
        
        return isLastPaymentInMonth || isNextDueInMonth;
      })
      .map(student => {
        const amountPaid = student.amountDue;
        const amountToBalance = amountPaid < 8000 ? 8000 - amountPaid : 0;
        return {
          ...student,
          amountPaidDisplay: amountPaid,
          amountToBalanceDisplay: amountToBalance,
        };
      })
      .sort((a,b) => a.fullName.localeCompare(b.fullName));
  }, [allStudents, selectedMonth, selectedYear]);


  if (!isClient) {
     return (
        <div>
            <PageHeader title="Admin Dashboard" description="Access the student management dashboard." />
            <div className="container mx-auto py-10 text-center">Loading admin panel...</div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onAuthenticated={handleSuccessfulLogin} pageTitle="Admin Dashboard" />;
  }

  return (
    <div>
      <PageHeader title="Admin Dashboard" />
      <section className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-primary">Welcome, Admin!</h2>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        {isLoading ? (
          <p>Loading dashboard data...</p>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="TOTAL STUDENTS"
                value={dashboardStats.totalStudents}
                icon={<Users className="h-5 w-5 text-primary" />}
              />
              <StatCard
                title="TOTAL REVENUE (Approved)"
                value={`₦${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={<BanknoteIcon className="h-5 w-5 text-green-500" />}
                description="Sum of last payments for approved students."
              />
              <StatCard
                title="TOTAL REGISTRATIONS"
                value={dashboardStats.totalRegistrations}
                icon={<FileText className="h-5 w-5 text-blue-500" />}
              />
              <StatCard
                title="PENDING PAYMENTS"
                value={dashboardStats.pendingPayments}
                icon={<Clock className="h-5 w-5 text-yellow-500" />}
                description="Awaiting verification"
              />
            </div>

            {/* Registration Distribution */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Registration Distribution by Program</CardTitle>
                <CardDescription>Breakdown of students by enrolled programs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardStats.programDistribution.length > 0 && allStudents.length > 0 ? (
                  dashboardStats.programDistribution.map((program) => (
                    <div key={program.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-muted-foreground">{program.name}</span>
                        <span className="text-sm font-medium text-foreground">{program.percentage}% ({program.count})</span>
                      </div>
                      <Progress value={program.percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No student data available for distribution or no students registered yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Monthly Payment Overview Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-lg text-primary flex items-center">
                            <CalendarDays className="mr-2 h-5 w-5" />
                            Monthly Payment Overview
                        </CardTitle>
                        <CardDescription>Student payments and balances for the selected month.</CardDescription>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Select 
                            value={selectedMonth.toString()} 
                            onValueChange={(value) => setSelectedMonth(parseInt(value))}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((month, index) => (
                                    <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select 
                            value={selectedYear.toString()}
                            onValueChange={(value) => setSelectedYear(parseInt(value))}
                        >
                            <SelectTrigger className="w-full sm:w-[120px]">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyPaymentOverviewStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead className="text-right">Amount Paid (₦)</TableHead>
                                    <TableHead className="text-right">Amount to Balance (₦)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyPaymentOverviewStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.fullName}</TableCell>
                                        <TableCell className="text-right">{student.amountPaidDisplay.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-destructive font-medium">
                                            {student.amountToBalanceDisplay > 0 ? student.amountToBalanceDisplay.toLocaleString() : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No approved student payments found for {MONTHS[selectedMonth]} {selectedYear}.
                    </p>
                )}
              </CardContent>
            </Card>
            
            {/* Management Links */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Management Sections</CardTitle>
                <CardDescription>Access detailed student and payment information.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <Link href="/admin/registrations" passHref>
                  <Button variant="outline" className="w-full h-16 text-base justify-between hover:bg-primary/5">
                    <span>
                      <ListOrdered className="mr-3 h-6 w-6 inline-block text-primary" />
                      Manage Student Registrations
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/admin/payments" passHref>
                  <Button variant="outline" className="w-full h-16 text-base justify-between hover:bg-primary/5">
                    <span>
                      <CreditCard className="mr-3 h-6 w-6 inline-block text-primary" />
                      Manage Payments & Renewals
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

    