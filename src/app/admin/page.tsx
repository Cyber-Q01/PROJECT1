
"use client"; 
import { useState, useEffect, FormEvent } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserCircle2, CheckCircle, XCircle, Eye, ShieldAlert, BadgeDollarSign, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
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

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  paymentReceiptUrl?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

const ADMIN_USERNAME = "folorunshoa08@gmail.com";
const ADMIN_PASSWORD = "Adekunle"; // In a real app, this would be hashed and checked on a server.

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Check if already authenticated from a previous session (very basic)
    if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
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
          selectedSubjects: Array.isArray(s.selectedSubjects) ? s.selectedSubjects : [],
          classTiming: s.classTiming === 'morning' || s.classTiming === 'afternoon' ? s.classTiming : 'morning',
          paymentReceiptUrl: s.paymentReceiptUrl || null,
          paymentStatus: s.paymentStatus || 'pending_payment',
        }));
        setStudents(loadedStudentsData);
      } catch (error) {
        console.error("Error loading students from localStorage", error);
        toast({ title: "Error", description: "Could not load student data.", variant: "destructive" });
        setStudents([]); 
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
      sessionStorage.setItem("isAdminAuthenticated", "true"); // Basic session persistence
      setLoginError('');
      toast({ title: "Login Successful", description: "Welcome, Admin!" });
    } else {
      setLoginError("Invalid username or password.");
      toast({ title: "Login Failed", description: "Incorrect credentials.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("isAdminAuthenticated");
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
      setStudents(prevStudents => prevStudents.map(s => s.id === studentId ? {...s, paymentStatus: status} : s)); // Update local state immediately
      toast({
        title: "Payment Status Updated",
        description: `Student ${studentId}'s payment marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error updating payment status in localStorage", error);
      toast({ title: "Update Failed", description: "Could not update payment status.", variant: "destructive" });
    }
  };

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

  // Authenticated View
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
              <CardTitle className="text-xl text-primary">Student Management</CardTitle>
              <CardDescription>Overview of registered students and their payment status.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading student data...</p>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <UserCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No student registrations found.</p>
                <p className="text-sm text-muted-foreground mt-1">New registrations will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Programs</TableHead>
                      <TableHead>Class Timing</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.fullName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.selectedSubjects.join(", ").toUpperCase()}</TableCell>
                        <TableCell className="capitalize">{student.classTiming}</TableCell>
                        <TableCell>
                          {student.paymentReceiptUrl ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" /> View</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Payment Receipt for {student.fullName}</AlertDialogTitle>
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
                              'outline' // pending_payment
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
                              Verified
                             </span>
                          )}
                           {student.paymentStatus === 'pending_payment' && (
                             <span className="text-xs text-muted-foreground italic">
                              Awaiting Proof
                             </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
