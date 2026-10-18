import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * PupputGate Expo config.
 *
 * The Google Maps Android key is read from the environment (EXPO_PUBLIC_MAPS or
 * GOOGLE_MAPS_ANDROID_KEY) and is only consumed by a development/production build
 * (`npx expo run:android` / EAS). In Expo Go, react-native-maps uses Expo Go's
 * own bundled key. The key is NEVER committed in source — see .env.example.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const androidMapsKey =
    process.env.GOOGLE_MAPS_ANDROID_KEY ?? process.env.EXPO_PUBLIC_MAPS ?? '';

  return {
    ...config,
    name: 'PupputGate',
    slug: 'pupputgate',
    scheme: 'pupputgate',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    ...( {
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#18B3AA',
      },
    } as any ),
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'tn.pupputgate.app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'PupputGate utilise votre position pour afficher les commerces proches. Vous pouvez refuser et choisir une zone manuellement.',
      },
    },
    android: {
      package: 'tn.pupputgate.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#18B3AA',
      },
      ...(androidMapsKey
        ? { config: { googleMaps: { apiKey: androidMapsKey } } }
        : {}),
    },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'PupputGate utilise votre position pour afficher les commerces proches.',
        },
      ],
      ...(androidMapsKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: androidMapsKey }] as unknown as [string, Record<string, unknown>]]
        : []),
    ],
    experiments: {
      typedRoutes: false,
    },
    extra: {
      // Optional explicit API URL; otherwise the client derives it from the
      // Expo packager host (works for Expo Go on a physical device over LAN).
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
    },
  };
};
