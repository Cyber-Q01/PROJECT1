
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Aisha Bello",
    role: "SS3 Student",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "student portrait",
    text: "First-Class Tutorials helped me understand complex topics easily. My grades improved significantly!",
    rating: 5,
  },
  {
    name: "Chinedu Okoro",
    role: "JAMB Candidate",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "student smiling",
    text: "The tutors are amazing and patient. I feel much more confident for my JAMB exams.",
    rating: 5,
  },
  {
    name: "Fatima Garba",
    role: "Parent",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "parent happy",
    text: "I've seen a remarkable improvement in my child's performance since joining First-Class. Highly recommended!",
    rating: 5,
  },
];

const services = [
  {
    title: "JAMB Preparatory Classes",
    description: "Comprehensive preparation for JAMB UTME, covering all subjects.",
    icon: "🎯",
    dataAiHint: "target goal"
  },
  {
    title: "WAEC/SSCE Tutoring",
    description: "In-depth coaching for WAEC, NECO, and GCE examinations.",
    icon: "📚",
    dataAiHint: "books education"
  },
  {
    title: "Post-UTME Screening Prep",
    description: "Specialized guidance for university post-UTME screening tests.",
    icon: "🎓",
    dataAiHint: "graduation cap"
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Unlock Your Academic Potential
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-xl mx-auto md:mx-0">
              Join First-Class Tutorial Center and achieve excellence in your examinations. Expert tutors, proven results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
                <Link href="/register">Register Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/services">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src="https://placehold.co/600x400.png"
              alt="Students studying"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl"
              data-ai-hint="students learning"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Why Choose First-Class Tutorials?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="bg-accent text-accent-foreground rounded-full p-3 w-fit mb-4">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold">Expert Tutors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Our experienced and dedicated tutors are experts in their fields, committed to your success.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="bg-accent text-accent-foreground rounded-full p-3 w-fit mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <CardTitle className="text-xl font-semibold">Personalized Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We offer tailored learning plans to meet individual student needs and learning styles.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="bg-accent text-accent-foreground rounded-full p-3 w-fit mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                </div>
                <CardTitle className="text-xl font-semibold">Proven Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Our track record of high scores and student achievements speaks for itself.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Our Services Preview */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Our Core Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="items-center">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <CardTitle className="text-xl font-semibold text-center">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-center">{service.description}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild variant="link" className="text-primary p-0">
                    <Link href="/services">Learn More <ChevronRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">What Our Students & Parents Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardContent className="pt-6 flex-grow">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint} />
                      <AvatarFallback>{testimonial.name.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-muted-foreground/50" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">&ldquo;{testimonial.text}&rdquo;</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-accent text-accent-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Excel?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Take the first step towards academic success. Register for our tutorial programs today or contact us for more information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
              <Link href="/register">Register Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-accent-foreground text-accent-foreground hover:bg-accent-foreground/10">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
