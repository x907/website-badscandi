import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Bad Scandi",
  description: "Terms and conditions for using Bad Scandi",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Terms of Service</h1>

      <div className="prose prose-neutral max-w-none space-y-6">
        <p className="text-neutral-600">
          Last updated: December 2024
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
          <p>
            By accessing or using Bad Scandi ("we," "our," or "us"), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use our website or services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Products and Orders</h2>
          <p>
            All products sold on Bad Scandi are handcrafted fiber art pieces. Each item is unique and
            may vary slightly from photos shown on the website.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Prices are listed in USD and include applicable taxes where required.</li>
            <li>We reserve the right to refuse or cancel any order for any reason.</li>
            <li>Product availability is subject to change without notice.</li>
            <li>Colors may appear differently on different screens and monitors.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Payment</h2>
          <p>
            We accept payment through Stripe, which supports major credit cards and other payment methods.
            By providing payment information, you represent that you are authorized to use the payment method.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Shipping and Delivery</h2>
          <p>
            Shipping times and costs are calculated at checkout. We are not responsible for delays
            caused by shipping carriers, customs, or other factors outside our control.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Risk of loss passes to you upon delivery to the carrier.</li>
            <li>International orders may be subject to import duties and taxes.</li>
            <li>Please ensure your shipping address is accurate; we are not responsible for packages
                sent to incorrect addresses provided by the customer.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Returns and Refunds</h2>
          <p>
            Due to the handcrafted nature of our products, all sales are final. We do not accept returns
            or offer refunds unless the item arrives damaged or significantly differs from its description.
          </p>
          <p>
            If you receive a damaged item, please contact us within 7 days of delivery with photos
            of the damage. We will work with you to resolve the issue.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
          <p>
            All content on this website, including images, text, designs, and logos, is the property
            of Bad Scandi and is protected by copyright and other intellectual property laws. You may
            not reproduce, distribute, or create derivative works without our written permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. User Accounts</h2>
          <p>
            When you create an account, you are responsible for maintaining the security of your account
            and all activities that occur under it. You must provide accurate and complete information
            when creating an account.
          </p>
          <p>
            Our sign-in options include passkeys, email magic links, and social login providers. Because
            these methods rely on access to your email account or linked social accounts, you are
            responsible for keeping those accounts secure. If a third party gains access to your email
            or social accounts, they may be able to access your Bad Scandi account. We are not liable
            for unauthorized access resulting from compromised email or social accounts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Reviews and User Content</h2>
          <p>
            By submitting a review or other content, you grant us a non-exclusive, royalty-free license
            to use, display, and publish that content. You represent that your reviews are honest and
            based on your genuine experience with our products.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Bad Scandi shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of our
            website or products.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms of Service at any time. Changes will be effective
            immediately upon posting to this page. Your continued use of our website after changes
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">11. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please visit our{" "}
            <a href="/contact" className="text-amber-900 hover:underline">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
