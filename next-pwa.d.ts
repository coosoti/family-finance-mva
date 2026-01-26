declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    sw?: string;
    swSrc?: string;
    publicExcludes?: string[];
    buildExcludes?: Array<RegExp | ((path: string) => boolean)>;
    cacheOnFrontEndNav?: boolean;
    aggressiveFrontEndNavCaching?: boolean;
    reloadOnOnline?: boolean;
    swcMinify?: boolean;
    workboxOptions?: Record<string, any>;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    runtimeCaching?: Array<Record<string, any>>;
    publicDir?: string;
    buildId?: string;
    disableStartupUrlCache?: boolean;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    extendDefaultRuntimeCaching?: boolean;
    importScripts?: string[];
    importScriptsStrategy?: 'lazy' | 'eager';
    navigationPreload?: boolean;
    navigationPreloadOptions?: {
      url?: string;
      state?: string;
    };
    cleanupOutdatedCaches?: boolean;
    clientsClaim?: boolean;
    excludeDefaultMaps?: boolean;
    exclude?: Array<RegExp | ((path: string) => boolean)>;
    include?: Array<RegExp | ((path: string) => boolean)>;
    maximumFileSizeToCacheInBytes?: number;
    modifyURLPrefix?: Record<string, string>;
    scope?: string;
    swDest?: string;
    swSrc?: string;
    webpackPlugins?: Array<any>;
  }

  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
