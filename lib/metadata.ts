import { Metadata } from "next";

const SITE_NAME = "Bad Scandi";
const SITE_DESCRIPTION = "Hand-dyed fiber art, boho wall hangings, and Scandinavian minimalist tapestries. Unique textile wall art for modern homes.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "Bad Scandi - Hand-Dyed Fiber Art & Boho Wall Hangings",
      template: "%s | Bad Scandi",
    },
    description: SITE_DESCRIPTION,
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
    },
    twitter: {
      card: "summary_large_image",
      title: "Bad Scandi - Hand-Dyed Fiber Art & Boho Wall Hangings",
      description: SITE_DESCRIPTION,
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
    },
  };
}
