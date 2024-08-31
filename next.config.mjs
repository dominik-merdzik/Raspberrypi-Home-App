import os from 'os';

/** @type {import('next').NextConfig} */
const isRaspberryPi = os.platform() === 'linux' && os.arch() === 'arm64';

const nextConfig = {
  ...(isRaspberryPi && { assetPrefix: 'https://pi.dominikmerdzik.com/' }),

  async headers() {
    return [
      {
        source: '/(.*)', // This will match all routes
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Adjust this to restrict origins if needed
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
