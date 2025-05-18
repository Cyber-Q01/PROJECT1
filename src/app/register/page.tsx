
"use client";

import { useState, useEffect, ChangeEvent } from "react";
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
import { CheckCircle2, UploadCloud, AlertCircle, Banknote } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TUTORIAL_FEE = 8000;

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
  classTiming: z.enum(["morning", "afternoon"], { required_error: "Please select a class timing" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface StoredStudentData extends RegistrationFormValues {
  id: string;
  registrationDate: string; // ISO string format
  amountDue: number;
  paymentReceiptUrl?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function RegisterPage() {
  const { toast } = useToast();
  const [registrationStep, setRegistrationStep] = useState<'form' | 'payment' | 'submitted'>('form');
  const [currentRegistrant, setCurrentRegistrant] = useState<StoredStudentData | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isSubmittingForm },
    reset,
    setValue,
    watch
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      selectedSubjects: [],
      classTiming: undefined,
    },
  });

  const selectedSubjectsWatch = watch("selectedSubjects");

  const handleFormSubmit: SubmitHandler<RegistrationFormValues> = (data) => {
    if (!isClient) return;
    try {
      const existingRegistrations: StoredStudentData[] = JSON.parse(localStorage.getItem("registrations") || "[]");
      const newRegistration: StoredStudentData = {
        ...data,
        id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        registrationDate: new Date().toISOString(),
        amountDue: TUTORIAL_FEE,
        paymentStatus: 'pending_payment',
        paymentReceiptUrl: null,
      };
      localStorage.setItem("registrations", JSON.stringify([...existingRegistrations, newRegistration]));
      setCurrentRegistrant(newRegistration);
      setRegistrationStep('payment');
      reset(); 
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Failed to save initial registration to localStorage", error);
      toast({
        title: "Registration Error",
        description: "Could not save your registration details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReceiptFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 2MB.",
          variant: "destructive",
        });
        setReceiptFile(null);
        setReceiptPreview(null);
        event.target.value = ""; 
        return;
      }
      setReceiptFile(file);
      const previewUrl = await getBase64(file);
      setReceiptPreview(previewUrl);
    } else {
      setReceiptFile(null);
      setReceiptPreview(null);
    }
  };

  const handlePaymentProofSubmit = async () => {
    if (!isClient || !currentRegistrant || !receiptFile) {
      toast({
        title: "Submission Error",
        description: "No registration data or receipt file found.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingProof(true);
    try {
      const receiptDataUrl = await getBase64(receiptFile);
      const existingRegistrations: StoredStudentData[] = JSON.parse(localStorage.getItem("registrations") || "[]");
      const updatedRegistrations = existingRegistrations.map(reg => 
        reg.id === currentRegistrant.id 
        ? { ...reg, paymentReceiptUrl: receiptDataUrl, paymentStatus: 'pending_verification' as const } 
        : reg
      );
      localStorage.setItem("registrations", JSON.stringify(updatedRegistrations));
      toast({
        title: "Payment Proof Submitted!",
        description: "Your payment proof has been uploaded. We will verify it shortly.",
      });
      setRegistrationStep('submitted');
      setReceiptFile(null);
      setReceiptPreview(null);
      setCurrentRegistrant(null); // Clear current registrant after submission
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Failed to save payment proof to localStorage", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload your payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProof(false);
    }
  };
  
  const startNewRegistration = () => {
    setRegistrationStep('form');
    setCurrentRegistrant(null);
    setReceiptFile(null);
    setReceiptPreview(null);
    reset(); 
  }

  if (!isClient) {
    return (
        <div>
            <PageHeader
                title="Student Registration"
                description="Enroll in our tutorial programs. We're excited to have you!"
            />
            <div className="container mx-auto py-10 text-center">Loading registration form...</div>
        </div>
    );
  }

  if (registrationStep === 'payment') {
    return (
      <div>
        <PageHeader title="Complete Your Registration" description="Make payment to finalize your enrollment." />
        <section className="container mx-auto py-10">
          <Card className="max-w-xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Step 2: Make Payment</CardTitle>
              <CardDescription>Hi {currentRegistrant?.fullName}, please proceed with payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Banknote className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-700 font-semibold">Tutorial Fee: ₦{TUTORIAL_FEE.toLocaleString()}</AlertTitle>
                <AlertDescription className="text-blue-600 mt-2">
                  Please make payment to the following account:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Account Name:</strong> First Class Educational</li>
                    <li><strong>Account Number:</strong> 123456789</li>
                    <li><strong>Bank:</strong> Opay</li>
                  </ul>
                   Ensure the narration includes your full name for easy identification. After payment, upload your receipt below.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="receiptUpload" className="flex items-center gap-2 mb-2 cursor-pointer text-sm font-medium">
                  <UploadCloud className="h-5 w-5 text-accent" />
                  Upload Payment Receipt
                </Label>
                <Input 
                  id="receiptUpload" 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleReceiptFileChange} 
                  className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {receiptPreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-1">Receipt Preview:</p>
                    <img src={receiptPreview} alt="Receipt preview" className="max-w-xs max-h-48 rounded-md border object-contain" />
                  </div>
                )}
                 {!receiptFile && <p className="text-xs text-muted-foreground mt-1">Please select a receipt file (PNG, JPG, JPEG, max 2MB).</p>}
              </div>
              <Button 
                onClick={handlePaymentProofSubmit} 
                disabled={!receiptFile || isSubmittingProof} 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSubmittingProof ? "Submitting Proof..." : "Confirm Payment & Submit Proof"}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  if (registrationStep === 'submitted') {
    return (
      <div>
        <PageHeader title="Registration & Payment Submitted" />
        <div className="container mx-auto py-16 text-center">
          <Card className="max-w-lg mx-auto shadow-xl">
            <CardHeader>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Thank You!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Your registration and payment proof have been successfully submitted. We will review your payment and get in touch with you soon regarding the next steps.
              </p>
              <Button onClick={startNewRegistration}>Register Another Student</Button>
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
            <CardTitle className="text-xl text-primary">Step 1: Personal Information</CardTitle>
            <CardDescription>Please provide accurate details. The tutorial fee is ₦{TUTORIAL_FEE.toLocaleString()}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                        checked={(selectedSubjectsWatch || []).includes(subject.id)}
                        onCheckedChange={(checked) => {
                          const currentSubjects = selectedSubjectsWatch || [];
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
                <Label>Preferred Class Timing</Label>
                <RadioGroup
                  onValueChange={(value: "morning" | "afternoon") => setValue("classTiming", value, { shouldValidate: true })}
                  className="mt-2 flex gap-4"
                  value={watch("classTiming")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning" className="font-normal">Morning Class</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon" className="font-normal">Afternoon Class</Label>
                  </div>
                </RadioGroup>
                {errors.classTiming && <p className="text-sm text-destructive mt-1">{errors.classTiming.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmittingForm} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmittingForm ? "Submitting..." : "Proceed to Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    