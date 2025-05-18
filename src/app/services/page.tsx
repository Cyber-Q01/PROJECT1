
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Clock, Users, BookOpen } from "lucide-react";

const services = [
  {
    title: "JAMB UTME Preparation",
    description: "Comprehensive coaching for all JAMB subjects. Intensive revision, mock exams, and time management strategies to help you ace your UTME.",
    subjects: ["Use of English", "Mathematics", "Physics", "Chemistry", "Biology", "Literature", "Government", "Economics", "CRS/IRS"],
    schedule: "Weekdays: 4 PM - 6 PM; Weekends: 10 AM - 2 PM",
    gains: [
      "In-depth understanding of JAMB syllabus",
      "Improved problem-solving skills",
      "Confidence to tackle exam questions",
      "Access to extensive practice materials",
    ],
    icon: <BookOpen className="h-10 w-10 text-primary mb-4" />,
  },
  {
    title: "WAEC/SSCE Tutoring",
    description: "Targeted lessons for WAEC, NECO, and GCE. We cover core subjects and provide guidance on practicals and exam techniques.",
    subjects: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Civic Education", "Data Processing", "Further Mathematics"],
    schedule: "Weekdays: 3 PM - 5 PM; Saturdays: 9 AM - 1 PM",
    gains: [
      "Mastery of WAEC/SSCE curriculum",
      "Effective strategies for theory and objective questions",
      "Guidance on practical assessments",
      "High success rate in previous exams",
    ],
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mb-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
  {
    title: "Post-UTME Screening Prep",
    description: "Specialized preparation for university-specific Post-UTME screening tests. We focus on common question patterns and speed.",
    subjects: ["Varies by university (General Paper, Subject-specific tests)"],
    schedule: "Intensive workshops (announced per screening season)",
    gains: [
      "Familiarity with Post-UTME formats",
      "Enhanced speed and accuracy",
      "Tips for specific university requirements",
      "Increased chances of admission",
    ],
    icon: <Users className="h-10 w-10 text-primary mb-4" />,
  },
  {
    title: "Junior Secondary (JSS) & Basic Education",
    description: "Solid foundation building for JSS students in core subjects, preparing them for BECE and senior secondary education.",
    subjects: ["Mathematics", "English Studies", "Basic Science & Technology", "Pre-Vocational Studies", "National Values Education"],
    schedule: "Weekdays: 2 PM - 4 PM",
    gains: [
      "Strong grasp of fundamental concepts",
      "Improved academic performance in school",
      "Preparation for Basic Education Certificate Examination (BECE)",
      "Development of critical thinking skills",
    ],
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mb-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHeader
        title="Our Tutorial Services"
        description="We offer a range of specialized tutorial services designed to help students excel at all levels of their education."
      />

      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <div className="flex justify-center md:justify-start">
                  {service.icon}
                </div>
                <CardTitle className="text-2xl font-semibold text-primary">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div>
                  <h4 className="font-semibold text-md mb-1">Subjects Offered:</h4>
                  <p className="text-sm text-muted-foreground">{service.subjects.join(", ")}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-md mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-accent" /> Schedule:
                  </h4>
                  <p className="text-sm text-muted-foreground">{service.schedule}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-md mb-2">What You Will Gain:</h4>
                  <ul className="space-y-1">
                    {service.gains.map((gain, i) => (
                      <li key={i} className="flex items-start text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{gain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/register">Register for {service.title}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Choose the service that best fits your needs and take the next step in your academic journey. Our team is here to support you all the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">Register Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Us for Enquiries</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

