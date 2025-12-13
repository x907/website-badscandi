import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // Content Security Policy - prevents XSS attacks
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com https://appleid.cdn-apple.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://badscandi-assets.s3.us-east-1.amazonaws.com https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.stripe.com",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com https://accounts.google.com https://appleid.apple.com",
      "frame-src 'self' https://js.stripe.com https://accounts.google.com https://appleid.apple.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    // Cache optimized images for 31 days (reduces re-transformations)
    minimumCacheTTL: 2678400,
    // Use only WebP format (cuts transformations in half vs avif+webp)
    formats: ["image/webp"],
    // Limit device sizes to reduce transformation variants (default has 8 sizes)
    deviceSizes: [640, 1080, 1920],
    // Limit image sizes for fixed-width images like thumbnails (default has 8 sizes)
    imageSizes: [80, 160, 320],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth avatars
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub avatars
      },
      {
        protocol: "https",
        hostname: "badscandi-assets.s3.us-east-1.amazonaws.com", // S3 images (products, reviews)
      },
    ],
  },
};

export default nextConfig;
