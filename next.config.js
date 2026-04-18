/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@whiskeysockets/baileys", "jimp", "sharp", "pino", "keyv"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
};

module.exports = nextConfig;
