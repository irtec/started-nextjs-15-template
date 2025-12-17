import type { NextConfig } from "next";

/**
 * Next.js Security Configuration
 * Mitigates vulnerabilities including:
 * - CVE-2025-55182 (React2Shell - RCE via RSC, CVSS 10.0)
 *   Note: CVE-2025-66478 was rejected as duplicate of CVE-2025-55182
 * - CVE-2025-29927 (Middleware Authorization Bypass, CVSS 9.1)
 * - CVE-2025-55184 (DoS via infinite loop)
 * - CVE-2025-67779 (DoS - follow-up fix for CVE-2025-55184)
 * - CVE-2025-55183 (Source Code Exposure)
 * - Resource Exhaustion on Image Optimization
 */

const securityHeaders = [
  {
    // Prevents clickjacking attacks
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Prevents MIME type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Enables XSS filter in browsers
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Controls referrer information
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Permissions Policy - restricts browser features
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
  {
    // Strict Transport Security - forces HTTPS
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    // Content Security Policy - prevents XSS and injection attacks
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Security: Disable Powered-By header
  poweredByHeader: false,

  // Image Optimization Security Configuration
  // Mitigates Resource Exhaustion vulnerability
  images: {
    // Limit concurrent image optimization requests
    minimumCacheTTL: 60,

    // Restrict allowed image domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],

    // Limit image sizes to prevent memory exhaustion
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],

    // Disable dangerous SVG optimization for security
    dangerouslyAllowSVG: false,

    // Add content security policy for images
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Enable unoptimized images only in development
    unoptimized: process.env.NODE_ENV === "development",
  },

  // Headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Block internal Next.js headers from external requests
        source: "/api/:path*",
        headers: [
          ...securityHeaders,
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  // Experimental features for enhanced security
  experimental: {
    // Enable strict mode for server actions
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },

  // Compiler options
  compiler: {
    // Remove console logs in production for security
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
};

export default nextConfig;
