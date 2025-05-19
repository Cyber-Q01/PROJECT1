
"use client";

import { useState, FormEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import PageHeader from "@/components/shared/PageHeader";

// These credentials could also be passed as props if they need to vary
const ADMIN_USERNAME_CONSTANT = "folorunshoa08@gmail.com";
const ADMIN_PASSWORD_CONSTANT = "Adekunle";

interface AdminLoginFormProps {
  onAuthenticated: () => void;
  pageTitle?: string;
  pageDescription?: string;
}

export default function AdminLoginForm({ 
  onAuthenticated, 
  pageTitle = "Admin Login", 
  pageDescription = "Access the student management dashboard." 
}: AdminLoginFormProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const { toast } = useToast();

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (usernameInput === ADMIN_USERNAME_CONSTANT && passwordInput === ADMIN_PASSWORD_CONSTANT) {
      onAuthenticated(); // Callback to parent component to set its own isAuthenticated state
      setLoginError('');
      toast({ title: "Login Successful", description: "Welcome, Admin!" });
    } else {
      setLoginError("Invalid username or password.");
      toast({ title: "Login Failed", description: "Incorrect credentials.", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title={pageTitle} description={pageDescription} />
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
