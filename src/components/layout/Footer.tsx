
import Link from "next/link";
import { BookOpenCheck, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4" prefetch={false}>
              <BookOpenCheck className="h-7 w-7 text-primary" />
              <span className="font-semibold text-lg">First-Class Tutorials</span>
            </Link>
            <p className="text-sm text-secondary-foreground/80">
              Empowering students to achieve academic excellence.
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors" prefetch={false}>About Us</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors" prefetch={false}>Services</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors" prefetch={false}>Register</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors" prefetch={false}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Education Lane, Knowledge City, NG</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:info@firstclass.com" className="hover:text-primary transition-colors">info@firstclass.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+234800000000" className="hover:text-primary transition-colors">+234 800 000 000</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-secondary-foreground/70">
          <p>&copy; {currentYear} First-Class Tutorial Center. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
