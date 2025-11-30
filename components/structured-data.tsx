import Script from "next/script";

interface ProductStructuredDataProps {
  product: {
    name: string;
    description: string;
    imageUrl: string;
    priceCents: number;
    slug: string;
  };
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    offers: {
      "@type": "Offer",
      url: `https://badscandi.com/product/${product.slug}`,
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Bad Scandi",
      },
    },
  };

  return (
    <Script
      id="product-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bad Scandi",
    url: "https://badscandi.com",
    logo: "https://badscandi.com/logo.png",
    description: "Hand-dyed fiber art, boho wall hangings, and Scandinavian minimalist tapestries.",
    sameAs: [
      // Add your social media URLs here
      // "https://www.instagram.com/badscandi",
      // "https://www.pinterest.com/badscandi",
      // "https://www.facebook.com/badscandi",
    ],
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
