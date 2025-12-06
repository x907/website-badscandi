import { Metadata } from "next";

const SITE_NAME = "Bad Scandi";
const SITE_DESCRIPTION = "Hand-dyed fiber art, boho wall hangings, and Scandinavian minimalist tapestries. Unique textile wall art for modern homes.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";
const DEFAULT_OG_IMAGE = "https://badscandi-assets.s3.us-east-1.amazonaws.com/images/hero-1.jpg";

export function getBaseMetadata(overrides?: {
  title?: string;
  description?: string;
}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: overrides?.title || {
      default: "Bad Scandi - Hand-Dyed Fiber Art & Boho Wall Hangings",
      template: "%s | Bad Scandi",
    },
    description: overrides?.description || SITE_DESCRIPTION,
    keywords: [
      "hand dyed fiber art",
      "boho wall hanging",
      "macrame tapestry",
      "dip dye tapestry",
      "modern wall decor",
      "Scandinavian home decor",
      "yarn wall hanging",
      "fiber art wall hanging",
      "bohemian home decor",
      "textile wall art",
      "woven wall hanging",
      "boho tapestry wall decor",
      "Scandi minimalist decor",
    ],
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: "Bad Scandi - Hand-Dyed Fiber Art & Boho Wall Hangings",
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Bad Scandi - Hand-Dyed Fiber Art",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Bad Scandi - Hand-Dyed Fiber Art & Boho Wall Hangings",
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function getProductMetadata(product: {
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  slug: string;
}): Metadata {
  const title = product.metaTitle || `${product.name} - Hand-Dyed Fiber Art`;
  const description = product.metaDescription || product.description.substring(0, 160);
  const price = (product.priceCents / 100).toFixed(2);

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/product/${product.slug}`,
      images: [
        {
          url: product.imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.imageUrl],
    },
  };
}

export function getShopMetadata(): Metadata {
  return {
    title: "Shop All - Hand-Dyed Fiber Art & Boho Wall Hangings",
    description: "Browse our collection of hand-dyed fiber art, macrame wall hangings, and Scandinavian minimalist tapestries. Unique textile wall art for every room.",
    openGraph: {
      title: "Shop All - Hand-Dyed Fiber Art & Boho Wall Hangings",
      description: "Browse our collection of hand-dyed fiber art, macrame wall hangings, and Scandinavian minimalist tapestries.",
      url: `${SITE_URL}/shop`,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Bad Scandi Shop - Hand-Dyed Fiber Art Collection",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function getAboutMetadata(): Metadata {
  return {
    title: "About - Handcrafted Fiber Art & Custom Commissions",
    description: "Learn about Bad Scandi's handcrafted fiber art process. We create unique boho wall hangings using traditional hand-dyeing techniques and natural materials. Custom commissions available.",
    openGraph: {
      title: "About Bad Scandi - Handcrafted Fiber Art",
      description: "Learn about our hand-dyeing process and custom fiber art commissions.",
      url: `${SITE_URL}/about`,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "About Bad Scandi - Handcrafted Fiber Art",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function getContactMetadata(): Metadata {
  return {
    title: "Contact Us",
    description: "Get in touch with Bad Scandi. Questions about our hand-dyed fiber art, custom commissions, or orders? We'd love to hear from you.",
    openGraph: {
      title: "Contact Bad Scandi",
      description: "Get in touch with us about fiber art, custom commissions, or orders.",
      url: `${SITE_URL}/contact`,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Contact Bad Scandi",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
