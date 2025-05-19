
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
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
import { CheckCircle2, Banknote, Calendar as CalendarIconLucide, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subYears, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";

const subjectsOffered = [
  { id: "jamb", label: "JAMB Preparatory Classes" },
  { id: "waec", label: "WAEC/SSCE Tutoring" },
  { id: "post_utme", label: "Post-UTME Screening Prep" },
  // { id: "edu_consult", label: "Educational Consultancy" }, // Removed
];

const registrationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  selectedSubjects: z.array(z.string()).min(1, "Please select at least one subject/program"),
  classTiming: z.enum(["morning", "afternoon"], { required_error: "Please select a class timing" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface StoredStudentData extends Omit<RegistrationFormValues, 'dateOfBirth'> {
  id: string; 
  dateOfBirth: string; 
  registrationDate: string; 
  amountDue: number; 
  senderName?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}


export default function RegisterPage() {
  const { toast } = useToast();
  const [registrationStep, setRegistrationStep] = useState<'form' | 'payment' | 'submitted'>('form');
  const [currentRegistrant, setCurrentRegistrant] = useState<StoredStudentData | null>(null);
  const [amountPayingInput, setAmountPayingInput] = useState<string>(""); 
  const [senderNameInput, setSenderNameInput] = useState<string>("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [calendarToYear, setCalendarToYear] = useState<number | undefined>(undefined);
  const [maxBirthDate, setMaxBirthDate] = useState<Date | undefined>(undefined);
  const minBirthDate = new Date("1950-01-01");


  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setMaxBirthDate(subYears(today, 5)); 
    setCalendarToYear(subYears(today, 5).getFullYear());
  }, []);
  
  const {
    control,
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
      dateOfBirth: undefined,
    },
  });

  const selectedSubjectsWatch = watch("selectedSubjects");

  const handleFormSubmit: SubmitHandler<RegistrationFormValues> = async (data) => {
    if (!isClient) return;

    const studentDataToSubmit = {
      ...data,
      dateOfBirth: data.dateOfBirth.toISOString(),
      registrationDate: new Date().toISOString(),
      amountDue: 0, 
      paymentStatus: 'pending_payment' as const,
      senderName: null, 
    };
    
    const { id, ...apiPayload } = { ...studentDataToSubmit, id: "" }; // id is not needed for POST

    try {
      console.log('[Registration] Submitting student data to API:', apiPayload);
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();
      console.log('[Registration] API Response:', result);

      if (!response.ok) {
        toast({
          title: "Registration Failed",
          description: result.details || result.error || "An unknown error occurred. Please try again or contact support.",
          variant: "destructive",
        });
        return;
      }
      
      const newRegistrationDataForState: StoredStudentData = {
        ...data, 
        id: result.studentId, 
        dateOfBirth: data.dateOfBirth.toISOString(),
        registrationDate: studentDataToSubmit.registrationDate,
        amountDue: studentDataToSubmit.amountDue,
        paymentStatus: studentDataToSubmit.paymentStatus,
        senderName: studentDataToSubmit.senderName,
      };
      
      setCurrentRegistrant(newRegistrationDataForState);
      setRegistrationStep('payment');
      setAmountPayingInput(""); 
      setSenderNameInput(""); 
      reset(); 
      window.scrollTo(0, 0);
      toast({
          title: "Registration Successful!",
          description: "Please proceed to the payment step.",
      });

    } catch (error: any) {
      console.error("[Registration] Failed to submit registration to API", error);
      toast({
        title: "Registration Error",
        description: `Could not submit your registration: ${error?.message || 'Please check your connection and try again.'}. Details: ${error.details || ''}`,
        variant: "destructive",
      });
    }
  };


  const handlePaymentProofSubmit = async () => {
    if (!isClient || !currentRegistrant ) {
      toast({
        title: "Submission Error",
        description: "No registration data found.",
        variant: "destructive",
      });
      return;
    }
    const paidAmount = parseFloat(amountPayingInput);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }
    if (!senderNameInput.trim()) {
      toast({
        title: "Sender Name Required",
        description: "Please enter the sender's name for payment confirmation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingProof(true);
    try {
      const payload = {
        amountDue: paidAmount,
        senderName: senderNameInput.trim(),
        paymentStatus: 'pending_verification' as const,
      };

      console.log(`[Payment] Submitting payment info for student ${currentRegistrant.id}:`, payload);
      const response = await fetch(`/api/students/${currentRegistrant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('[Payment] API Response:', result);

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to submit payment information to server.");
      }
      
      toast({
        title: "Payment Information Submitted!",
        description: `Your payment information (Amount: ₦${paidAmount.toLocaleString()}, Sender: ${senderNameInput}) has been submitted. We will verify it shortly.`,
      });
      setRegistrationStep('submitted');
      setCurrentRegistrant(null); 
      setAmountPayingInput(""); 
      setSenderNameInput("");
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("[Payment] Failed to submit payment proof", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit your payment information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProof(false);
    }
  };
  
  const startNewRegistration = () => {
    setRegistrationStep('form');
    setCurrentRegistrant(null);
    setAmountPayingInput("");
    setSenderNameInput("");
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
              <CardTitle className="text-xl text-primary">Step 2: Make Payment & Confirm</CardTitle>
              <CardDescription>Hi {currentRegistrant?.fullName}, please proceed with payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Banknote className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-700 font-semibold">Payment Instructions</AlertTitle>
                <AlertDescription className="text-blue-600 mt-2">
                  Please make payment to the following account:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Account Name:</strong> First Class Educational</li>
                    <li><strong>Account Number:</strong> 123456789</li>
                    <li><strong>Bank:</strong> Opay</li>
                  </ul>
                   Ensure the narration includes your full name. After payment, enter the amount paid and the sender's name below.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="amountPaying">Amount Paying (₦)</Label>
                <Input 
                  id="amountPaying" 
                  type="number" 
                  value={amountPayingInput}
                  onChange={(e) => setAmountPayingInput(e.target.value)}
                  placeholder="e.g., 8000"
                  className="mt-1"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="senderNameInput" className="flex items-center gap-2 mb-1">
                  <User className="h-5 w-5 text-accent" />
                  Sender's Name (for payment confirmation)
                </Label>
                <Input 
                  id="senderNameInput" 
                  type="text" 
                  value={senderNameInput}
                  onChange={(e) => setSenderNameInput(e.target.value)}
                  placeholder="Enter the name on the sender's account"
                  className="mt-1"
                />
                 <p className="text-xs text-muted-foreground mt-1">This name will be used to verify your payment.</p>
              </div>

              <Button 
                onClick={handlePaymentProofSubmit} 
                disabled={isSubmittingProof || !amountPayingInput || parseFloat(amountPayingInput) <= 0 || !senderNameInput.trim()} 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSubmittingProof ? "Submitting..." : "Confirm Payment Information"}
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
        <PageHeader title="Registration & Payment Info Submitted" />
        <div className="container mx-auto py-16 text-center">
          <Card className="max-w-lg mx-auto shadow-xl">
            <CardHeader>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Thank You!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Your registration and payment information have been successfully submitted. We will review your payment and get in touch with you soon regarding the next steps.
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
            <CardDescription>Please provide accurate details. You will specify the amount paid in the next step.</CardDescription>
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
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!isClient || !maxBirthDate}
                        >
                          <CalendarIconLucide className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        {isClient && calendarToYear && maxBirthDate && ( 
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={minBirthDate.getFullYear()}
                            toYear={calendarToYear}
                            fromDate={minBirthDate}
                            toDate={maxBirthDate}
                            disabled={(date) => date > (maxBirthDate as Date) || date < minBirthDate}
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
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
    

    
