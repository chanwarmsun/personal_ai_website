/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // 智能构建ID生成 - 开发时使用时间戳，生产时使用版本或哈希
  generateBuildId: async () => {
    if (process.env.NODE_ENV === 'development') {
      return `dev-${Date.now()}`
    }
    // 生产环境使用更稳定的构建ID
    return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || `build-${Date.now()}`
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
    // 优化图片加载性能
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 300,
  },
  // 环境变量配置
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // 优化的Webpack配置
  webpack: (config, { isServer, dev }) => {
    // 开发环境启用缓存以提升构建速度
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    } else {
      // 生产环境使用内存缓存
      config.cache = {
        type: 'memory',
      };
    }
    
    // 确保JSON文件可以被导入
    config.module.rules.push({
      test: /\.json$/,
      type: 'json'
    });
    
    // 优化模块解析
    config.resolve = {
      ...config.resolve,
      symlinks: false,
      // 添加缓存以提升解析速度
      cache: true,
    };

    // 优化代码分割
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 第三方库单独打包
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Supabase单独打包
          supabase: {
            name: 'supabase',
            chunks: 'all',
            test: /node_modules\/@supabase/,
            priority: 30
          },
          // 公共组件
          common: {
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            priority: 10
          }
        }
      };
    }
    
    return config;
  },
  // 添加性能优化配置
  poweredByHeader: false,
  compress: true,
  // 启用实验性特性以提升性能
  experimental: {
    ...nextConfig.experimental,
    optimizeCss: true,
    scrollRestoration: true,
  }
}

module.exports = nextConfig 