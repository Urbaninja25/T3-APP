/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    domains: ["img.clerk.com"],
  },
  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  // ასე ვეუბნებით vercal ს რო მოდი რა შენ უბრალოდ build ი გააკეთე და კოდის ჩეკს თავი დაანებეო რადგან ვიცით რომ ამას github ci გააკეთებს
  typescript: { ignoreBuildErrors: true },

  eslint: {
    ignoreDuringBuilds: true,
  },
  //experimental flag for using swc teh minidfier instead of babbel which speed up buildup as well
  // swcMinify: true,
};

export default config;
