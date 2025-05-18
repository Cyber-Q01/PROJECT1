
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const subjectsOffered = [
  { id: "jamb", label: "JAMB Preparatory Classes" },
  { id: "waec", label: "WAEC/SSCE Tutoring" },
  { id: "post_utme", label: "Post-UTME Screening Prep" },
  { id: "jss", label: "Junior Secondary (JSS)" },
];

const registrationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  selectedSubjects: z.array(z.string()).min(1, "Please select at least one subject/program"),
  classMode: z.enum(["online", "physical"], { required_error: "Please select a class mode" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      selectedSubjects: [],
      classMode: undefined,
    },
  });

  const selectedSubjectsWatch = watch("selectedSubjects");

  const onSubmit: SubmitHandler<RegistrationFormValues> = (data) => {
    if (!isClient) return;
    try {
      const existingRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]");
      localStorage.setItem("registrations", JSON.stringify([...existingRegistrations, data]));
      toast({
        title: "Registration Successful!",
        description: "Your information has been submitted. We will contact you shortly.",
        variant: "default",
      });
      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error("Failed to save to localStorage", error);
      toast({
        title: "Registration Failed",
        description: "Could not save your registration. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isClient) {
    // Render a loading state or null during server-side rendering and initial client-side mount
    return (
        <div>
            <PageHeader
                title="Student Registration"
                description="Fill out the form below to enroll in our tutorial programs. We're excited to have you!"
            />
            <div className="container mx-auto py-10 text-center">Loading form...</div>
        </div>
    );
  }


  if (isSubmitted) {
    return (
      <div>
        <PageHeader title="Registration Successful" />
        <div className="container mx-auto py-16 text-center">
          <Card className="max-w-lg mx-auto shadow-xl">
            <CardHeader>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Thank You for Registering!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Your registration details have been received. A confirmation email has been sent to your provided email address (simulated). We will get in touch with you soon regarding the next steps.
              </p>
              <Button onClick={() => setIsSubmitted(false)}>Register Another Student</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Student Registration"
        description="Fill out the form below to enroll in our tutorial programs. We're excited to have you!"
      />
      <section className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Personal Information</CardTitle>
            <CardDescription>Please provide accurate details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName")} className="mt-1" />
                {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register("email")} className="mt-1" />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" {...register("phone")} className="mt-1" />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <Label htmlFor="address">Residential Address</Label>
                <Input id="address" {...register("address")} className="mt-1" />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <Label>Select Program(s)/Subject(s)</Label>
                <div className="mt-2 space-y-2">
                  {subjectsOffered.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject.id}
                        checked={selectedSubjectsWatch.includes(subject.id)}
                        onCheckedChange={(checked) => {
                          const currentSubjects = selectedSubjectsWatch;
                          if (checked) {
                            setValue("selectedSubjects", [...currentSubjects, subject.id], { shouldValidate: true });
                          } else {
                            setValue("selectedSubjects", currentSubjects.filter((s) => s !== subject.id), { shouldValidate: true });
                          }
                        }}
                      />
                      <Label htmlFor={subject.id} className="font-normal">{subject.label}</Label>
                    </div>
                  ))}
                </div>
                {errors.selectedSubjects && <p className="text-sm text-destructive mt-1">{errors.selectedSubjects.message}</p>}
              </div>

              <div>
                <Label>Preferred Class Mode</Label>
                <RadioGroup
                  onValueChange={(value: "online" | "physical") => setValue("classMode", value, { shouldValidate: true })}
                  className="mt-2 flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="font-normal">Online</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physical" id="physical" />
                    <Label htmlFor="physical" className="font-normal">Physical (At Center)</Label>
                  </div>
                </RadioGroup>
                {errors.classMode && <p className="text-sm text-destructive mt-1">{errors.classMode.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
