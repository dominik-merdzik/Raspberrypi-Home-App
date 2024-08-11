import os from 'os';

/** @type {import('next').NextConfig} */
const isRaspberryPi = os.platform() === 'linux' && os.arch() === 'arm';

const nextConfig = {
  ...(isRaspberryPi && { assetPrefix: 'https://pi.dominikmerdzik.com/' }),
};

export default nextConfig;

