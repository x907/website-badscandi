import { getAboutMetadata } from "@/lib/metadata";

export const metadata = getAboutMetadata();

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-8 sm:space-y-12">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">About Bad Scandi</h1>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600">
            Hand-dyed fiber art wall hangings inspired by Scandinavian design
          </p>

          {/* Press Feature */}
          <a
            href="https://midwestdesignmag.com/interior-spaces/scandinavian-style-tapestries-by-bad-scandi-pay-homage-to-heritage/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden bg-amber-50 border border-neutral-200 flex items-center justify-center">
              <span className="text-amber-900 font-serif text-lg sm:text-xl font-medium">MDM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">As featured in</p>
              <p className="font-medium text-neutral-900 group-hover:text-amber-900 transition-colors">
                Midwest Design Magazine
              </p>
              <p className="text-sm text-neutral-600 truncate">
                "Scandinavian-Style Tapestries Pay Homage to Heritage"
              </p>
            </div>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-amber-900 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Meet Ashley</h2>
          <p className="text-neutral-600 leading-relaxed">
            Bad Scandi was founded by Ashley Dias, a self-taught fiber artist who discovered her passion for creating handcrafted wool tapestries during the COVID-19 pandemic. What began as an exploration during uncertain times transformed into a thriving fiber art business rooted in Scandinavian heritage and minimalist design principles.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            With a background in abstract canvas painting, Ashley transitioned to fiber art, drawn to the unique possibilities of the dip-dyeing process. "The dip-dyeing process incorporated more of my painting background," she explains. This fusion of painting techniques with textile arts creates truly one-of-a-kind pieces.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            Each tapestry reflects Ashley's Scandinavian heritage, featuring minimalist aesthetics with neutral color palettes. Her work emphasizes organic patterns and natural beauty, creating pieces that "inspire a sense of calmness and peace" while adding textural depth to any interior.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">The Creative Process</h2>
          <p className="text-neutral-600 leading-relaxed">
            Each piece begins with a client consultation for custom commissions. Ashley creates design sketches on her iPad for approval before moving into production. The wood panels are carefully prepared, then hundreds of wool strands are measured, cut, and adhered to the panel.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            The dip-dyeing process takes several weeks, with each strand carefully hand-dyed using various colors to create organic gradient effects. This meticulous technique, inspired by traditional painting methods, ensures that every tapestry is truly one-of-a-kind with rich texture and depth.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            The result is a handcrafted work of fiber art that adds warmth, texture, and a sense of tranquility to any space. These pieces work beautifully hung above beds and sideboards, or as statement pieces in living areas.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Materials</h2>
          <p className="text-neutral-600 leading-relaxed">
            We use only the highest quality natural materials:
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-600">
            <li>100% wool fibers for rich texture and durability</li>
            <li>Natural cotton rope and yarn for classic macrame pieces</li>
            <li>Linen blends for a refined, minimalist aesthetic</li>
            <li>Sustainable wood panels (maple and walnut) for hanging</li>
          </ul>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Custom Commissions</h2>
          <p className="text-neutral-600 leading-relaxed">
            While our current collection features sold pieces from our portfolio, we're always excited to create custom fiber art for your space. Each commission is tailored to your vision, size requirements, and color preferences.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            Interested in a custom piece?{" "}
            <a href="/contact" className="text-amber-900 hover:underline font-medium">
              Get in touch
            </a>{" "}
            to discuss your project.
          </p>
        </div>
      </div>
    </div>
  );
}
