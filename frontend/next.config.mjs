/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un servidor autocontenido para la imagen Docker
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
