
"use client"; 
import { useState, useEffect, FormEvent, useMemo } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserCircle2, Users, Banknote as BanknoteIcon, FileText, Clock, ShieldAlert } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';

const programFilters = [
  { id: "jamb", label: "JAMB" },
  { id: "waec", label: "WAEC/SSCE" },
  { id: "post_utme", label: "Post-UTME" },
  { id: "edu_consult", label: "Edu Consult" },
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

const ADMIN_USERNAME = "folorunshoa08@gmail.com";
const ADMIN_PASSWORD = "Adekunle"; 

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


export default function AdminPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

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
    setAllStudents([]); // Clear student data on logout
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
    const totalRegistrations = totalStudents; // Assuming one registration per student
    const pendingPayments = allStudents.filter(s => s.paymentStatus === 'pending_verification').length;

    const programDistribution = programFilters.map(progFilter => {
      const count = allStudents.filter(s => s.selectedSubjects.includes(progFilter.id)).length;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
      return { name: progFilter.label, count, percentage };
    });

    return { totalStudents, totalRevenue, totalRegistrations, pendingPayments, programDistribution };
  }, [allStudents]);


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

  return (
    <div>
      <PageHeader title="Admin Dashboard" />
      <section className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-primary">Admin Dashboard</h2>
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
                title="TOTAL REVENUE"
                value={`₦${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={<BanknoteIcon className="h-5 w-5 text-green-500" />}
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
              />
            </div>

            {/* Registration Distribution */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Registration Distribution</CardTitle>
                <CardDescription>Breakdown of students by enrolled programs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardStats.programDistribution.length > 0 ? (
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
                  <p className="text-sm text-muted-foreground">No student data available for distribution.</p>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                For detailed student lists and payment verification, please refer to the respective management pages (to be added).
              </p>
               {/* Placeholder for links to detailed table views if needed in future */}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// Helper function to get tailwind class names (cn)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
