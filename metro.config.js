// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep the Metro bundler from traversing the backend workspace.
config.resolver.blockList = [/\/server\/.*/, /\/prisma\/.*/];

module.exports = config;
