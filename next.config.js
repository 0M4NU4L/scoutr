/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "m.media-amazon.com",
      "images-na.ssl-images-amazon.com",
      "rukminim1.flixcart.com",
      "rukminim2.flixcart.com",
      "media.croma.com",
      "upload.wikimedia.org",
      "static-assets-web.flixcart.com",
      "media-ik.croma.com",
      "serpapi.com",
      "encrypted-tbn0.gstatic.com",
      "encrypted-tbn1.gstatic.com",
      "encrypted-tbn2.gstatic.com",
      "encrypted-tbn3.gstatic.com",
      "img.alicdn.com",
      "ae01.alicdn.com",
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
