
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";


const contactSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Contact form data:", data);
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We will get back to you soon.",
    });
    reset();
  };

  if (!isClient) {
    return (
      <div>
        <PageHeader
          title="Get In Touch"
          description="We'd love to hear from you! Whether you have questions, feedback, or need assistance, feel free to reach out."
        />
        <div className="container mx-auto py-10 text-center">Loading contact form...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Get In Touch"
        description="We'd love to hear from you! Whether you have questions, feedback, or need assistance, feel free to reach out."
      />
      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name")} className="mt-1" />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...register("email")} className="mt-1" />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" {...register("subject")} className="mt-1" />
                  {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" {...register("message")} className="mt-1" rows={5} />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Our Address</h3>
                    <p className="text-muted-foreground">123 Education Lane, Knowledge City, Nigeria</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Email Us</h3>
                    <a href="mailto:info@firstclass.com" className="text-muted-foreground hover:text-primary transition-colors">info@firstclass.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Call Us</h3>
                    <a href="tel:+234800000000" className="text-muted-foreground hover:text-primary transition-colors">+234 800 000 0000</a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Our Location</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Placeholder for map. Actual map integration (e.g. Google Maps) would require API keys and setup. */}
                <div className="aspect-video bg-muted flex items-center justify-center">
                   <Image src="https://placehold.co/600x400.png" alt="Map placeholder" width={600} height={400} data-ai-hint="map location" className="w-full h-full object-cover"/>
                </div>
                 <p className="p-4 text-sm text-muted-foreground">Note: This is a placeholder image. An interactive map would be embedded here.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
