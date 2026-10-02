/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers applied to every response. These don't require
  // any paid service — they're just HTTP response headers.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops the site being framed by another page (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops the browser guessing a file's type from its content.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak the full URL (which could contain a magic-link
          // token) to third-party sites via the Referer header.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features this app never uses.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
