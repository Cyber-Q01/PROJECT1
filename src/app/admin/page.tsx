
"use client"; 
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from "@/components/shared/PageHeader";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, Banknote as BanknoteIcon, FileText, Clock, ArrowRight, ListOrdered, CreditCard } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

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


export default function AdminDashboardPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    // Revenue is based on all 'approved' payments. If monthly, this sums all recorded monthly payments.
    const totalRevenue = allStudents
      .filter(s => s.paymentStatus === 'approved') 
      .reduce((sum, s) => sum + s.amountDue, 0); // amountDue here reflects the last payment amount
    const totalRegistrations = totalStudents; 
    const pendingPayments = allStudents.filter(s => s.paymentStatus === 'pending_verification').length;

    const programDistribution = programFilters.map(progFilter => {
      const count = allStudents.filter(s => Array.isArray(s.selectedSubjects) && s.selectedSubjects.includes(progFilter.id)).length;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
      return { name: progFilter.label, count, percentage };
    });

    return { totalStudents, totalRevenue, totalRegistrations, pendingPayments, programDistribution };
  }, [allStudents]);


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
                title="TOTAL REVENUE (Last Payments)"
                value={`₦${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={<BanknoteIcon className="h-5 w-5 text-green-500" />}
                description="Based on last recorded payments for approved students."
              />
              <StatCard
                title="REGISTRATIONS"
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
                <CardTitle className="text-lg text-primary">Registration Distribution</CardTitle>
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
