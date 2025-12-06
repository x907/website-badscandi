import { ContactForm } from "@/components/contact-form";
import { Clock } from "lucide-react";
import { getContactMetadata } from "@/lib/metadata";

export const metadata = getContactMetadata();

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Get in Touch</h1>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600">
            Questions about our fiber art? Interested in custom orders or wholesale? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-4 text-lg">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-900 mt-0.5" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-neutral-600">Within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-8">
              <h3 className="font-semibold mb-4 text-lg">Common Questions</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Custom Orders</p>
                  <p className="text-neutral-600">
                    Yes! We love creating custom pieces. Include your vision, preferred colors, and dimensions.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Wholesale</p>
                  <p className="text-neutral-600">
                    Interested in carrying our fiber art in your store? Select "Wholesale Inquiry" below.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Shipping</p>
                  <p className="text-neutral-600">
                    We ship worldwide! Questions about international orders? Let us know.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
