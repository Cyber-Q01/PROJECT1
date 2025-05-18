
import PageHeader from "@/components/shared/PageHeader";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Gem, Users, BookOpen } from "lucide-react";

const tutors = [
  {
    name: "Dr. Amina Yusuf",
    subject: "Mathematics & Physics",
    bio: "PhD in Applied Mathematics with 10+ years of teaching experience. Passionate about making complex concepts simple.",
    avatar: "https://placehold.co/150x150.png",
    dataAiHint: "teacher portrait"
  },
  {
    name: "Mr. Bolaji Adekunle",
    subject: "English Language & Literature",
    bio: "MA in English, seasoned WAEC examiner. Expert in essay writing and literary analysis.",
    avatar: "https://placehold.co/150x150.png",
    dataAiHint: "educator profile"
  },
  {
    name: "Mrs. Chisom Nwosu",
    subject: "Chemistry & Biology",
    bio: "MSc in Biochemistry, specialist in practical demonstrations and exam strategies for science subjects.",
    avatar: "https://placehold.co/150x150.png",
    dataAiHint: "scientist smiling"
  },
];

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="About First-Class Tutorial Center"
        description="Learn about our commitment to fostering academic growth and empowering students to reach their full potential."
      />

      {/* Mission and Values Section */}
      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">Our Mission & Values</h2>
            <p className="text-muted-foreground mb-4">
              At First-Class Tutorial Center, our mission is to provide high-quality, personalized education that inspires students to achieve academic excellence and develop a lifelong love for learning. We are committed to creating a supportive and engaging environment where every student can thrive.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-full mt-1">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Excellence</h3>
                  <p className="text-muted-foreground text-sm">Striving for the highest standards in teaching and learning.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-full mt-1">
                  <Gem className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Integrity</h3>
                  <p className="text-muted-foreground text-sm">Upholding honesty and ethical conduct in all our interactions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-full mt-1">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Student-Centered</h3>
                  <p className="text-muted-foreground text-sm">Prioritizing the individual needs and success of each student.</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x450.png"
              alt="Group of diverse students collaborating"
              width={600}
              height={450}
              className="rounded-lg shadow-xl"
              data-ai-hint="students collaboration"
            />
          </div>
        </div>
      </section>

      {/* Our History Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-primary mb-6">Our Journey</h2>
            <p className="text-muted-foreground mb-4">
              Founded in 2010, First-Class Tutorial Center started with a small group of passionate educators aiming to make a difference in students' lives. Over the years, we have grown into a reputable institution, known for our commitment to quality education and outstanding student results.
            </p>
            <p className="text-muted-foreground">
              We continually adapt our teaching methods and curriculum to meet the evolving educational landscape, ensuring our students are well-prepared for their exams and future academic pursuits.
            </p>
          </div>
        </div>
      </section>
      
      {/* Our Tutors Section */}
      <section className="container mx-auto py-16">
        <h2 className="text-3xl font-bold text-primary text-center mb-12">Meet Our Expert Tutors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutors.map((tutor) => (
            <Card key={tutor.name} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                  <AvatarImage src={tutor.avatar} alt={tutor.name} data-ai-hint={tutor.dataAiHint}/>
                  <AvatarFallback>{tutor.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl font-semibold">{tutor.name}</CardTitle>
                <p className="text-sm text-accent">{tutor.subject}</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{tutor.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
