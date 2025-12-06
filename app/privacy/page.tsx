import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Bad Scandi",
  description: "How Bad Scandi collects, uses, and protects your personal information",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-neutral max-w-none space-y-6">
        <p className="text-neutral-600">
          Last updated: December 2024
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Bad Scandi ("we," "our," or "us") respects your privacy and is committed to protecting
            your personal information. This Privacy Policy explains how we collect, use, and safeguard
            your information when you visit our website or make a purchase.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>

          <h3 className="text-lg font-medium">Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Email address when you create an account or sign in.</li>
            <li><strong>Order Information:</strong> Name, shipping address, and billing information when you make a purchase.</li>
            <li><strong>Reviews:</strong> Content you submit when leaving product reviews.</li>
            <li><strong>Communications:</strong> Information you provide when contacting us.</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent on pages, and navigation paths.</li>
            <li><strong>Analytics:</strong> We use Vercel Analytics and Speed Insights to understand how visitors use our site.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Respond to your questions and requests</li>
            <li>Improve our website and products</li>
            <li>Send marketing emails (only if you opt in)</li>
            <li>Prevent fraud and enhance security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Information Sharing</h2>
          <p>We do not sell your personal information. We share your information only with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Payment Processors:</strong> Stripe processes payments on our behalf.</li>
            <li><strong>Shipping Carriers:</strong> To deliver your orders.</li>
            <li><strong>Service Providers:</strong> Who help us operate our business (hosting, email, analytics).</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to remember your preferences, understand how
            you use our site, and improve your experience. You can control cookies through your
            browser settings.
          </p>
          <p>Types of cookies we use:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the website to function (cart, authentication).</li>
            <li><strong>Analytics Cookies:</strong> Help us understand site usage patterns.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information.
            However, no method of transmission over the internet is 100% secure. We use HTTPS
            encryption for all data transmission and never store complete payment card information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and comply
            with legal obligations. Order information is kept for accounting and legal purposes.
            You can request deletion of your account at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt out of marketing communications</li>
            <li>Data portability</li>
          </ul>
          <p>
            To exercise these rights, please contact us at the email address below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Third-Party Services</h2>
          <p>Our website uses the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> Payment processing (<a href="https://stripe.com/privacy" className="text-amber-900 hover:underline">Privacy Policy</a>)</li>
            <li><strong>Vercel:</strong> Hosting and analytics (<a href="https://vercel.com/legal/privacy-policy" className="text-amber-900 hover:underline">Privacy Policy</a>)</li>
            <li><strong>Google:</strong> Authentication (<a href="https://policies.google.com/privacy" className="text-amber-900 hover:underline">Privacy Policy</a>)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Children's Privacy</h2>
          <p>
            Our website is not intended for children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated revision date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p className="font-medium">
            hello@badscandi.com
          </p>
        </section>
      </div>
    </div>
  );
}
