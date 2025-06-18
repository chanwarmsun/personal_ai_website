/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // 强制缓存失效 - 解决Vercel构建问题
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  // 环境变量配置
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Webpack配置确保JSON文件正确处理
  webpack: (config, { isServer }) => {
    // 禁用缓存以避免构建问题
    config.cache = false;
    
    // 确保JSON文件可以被导入
    config.module.rules.push({
      test: /\.json$/,
      type: 'json'
    });
    
    // 确保模块解析正确
    config.resolve = {
      ...config.resolve,
      symlinks: false,
    };
    
    return config;
  },
}

module.exports = nextConfig 