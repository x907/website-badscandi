import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ReviewSubmissionForm } from "@/components/review-submission-form";
import { getBaseMetadata } from "@/lib/metadata";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = getBaseMetadata({
  title: "Submit a Review",
  description: "Share your experience with Bad Scandi's hand-dyed fiber art wall hangings",
});

interface SubmitReviewPageProps {
  searchParams: Promise<{
    product?: string;
  }>;
}

export default async function SubmitReviewPage({ searchParams }: SubmitReviewPageProps) {
  const { product } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">Submit a Review</h1>
              <p className="text-muted-foreground text-lg">
                Only verified customers can submit reviews
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-xs border border-border p-6 sm:p-8 md:p-12 text-center">
              <p className="text-muted-foreground mb-6">
                You must be signed in and have purchased a product to submit a review.
                This helps us ensure all reviews are from real customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button size="lg" variant="outline">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">Share Your Experience</h1>
            <p className="text-muted-foreground text-lg">
              We'd love to hear about your Bad Scandi wall hanging!
              Your review helps other customers and supports our small business.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-xs border border-border p-6 sm:p-8 md:p-12">
            <ReviewSubmissionForm preSelectedProductId={product} />
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Reviews are moderated and will appear on the site after approval.
              Thank you for your support!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
