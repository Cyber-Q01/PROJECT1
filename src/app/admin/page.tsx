
"use client"; // Required for localStorage access and event handlers
import { useState, useEffect } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserCircle2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  selectedSubjects: string[];
  classMode: string;
}

// Dummy student data, in a real app this would come from a database
const dummyStudents: Student[] = [
  { id: "1", fullName: "Adaobi Nwosu", email: "ada@example.com", phone: "08012345678", selectedSubjects: ["jamb", "waec"], classMode: "physical" },
  { id: "2", fullName: "Bamidele Johnson", email: "bam@example.com", phone: "09087654321", selectedSubjects: ["post_utme"], classMode: "online" },
  { id: "3", fullName: "Chukwuma Eze", email: "chukwu@example.com", phone: "07011223344", selectedSubjects: ["jss"], classMode: "physical" },
];

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const storedRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]");
        // Combine dummy data with localStorage data for demonstration, ensuring unique IDs if possible
        // For simplicity, we'll just show localStorage data if available, else dummy.
        // A real app would fetch from a backend.
        if (storedRegistrations.length > 0) {
          setStudents(storedRegistrations.map((s: any, i: number) => ({ ...s, id: `local-${i}` })));
        } else {
          setStudents(dummyStudents);
        }
      } catch (error) {
        console.error("Error loading students from localStorage", error);
        setStudents(dummyStudents); // Fallback to dummy data
      } finally {
        setIsLoading(false);
      }
    }
  }, [isClient]);

  const handleLogout = () => {
    // In a real app, this would clear session/token and redirect
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out (simulated).",
    });
    // Potentially redirect: router.push('/login');
  };

  if (!isClient) {
     return (
        <div>
            <PageHeader title="Admin Dashboard" />
            <div className="container mx-auto py-10 text-center">Loading admin panel...</div>
        </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Manage student registrations and site settings."
      />
      <section className="container mx-auto py-10">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-primary">Student List</CardTitle>
              <CardDescription>Overview of registered students.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout (Simulated)
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
                      <TableHead>Class Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.fullName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.selectedSubjects.join(", ").toUpperCase()}</TableCell>
                        <TableCell className="capitalize">{student.classMode}</TableCell>
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

