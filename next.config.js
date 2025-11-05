/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors https://*.studio.site https://studio.design;" }
        ]
      }
    ];
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/analyze",
        permanent: false // 本番で恒久的にするなら true にしてOK
      }
    ];
  }
};

module.exports = nextConfig;
