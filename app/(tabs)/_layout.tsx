import React from 'react';
import { Keyboard, StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StatusPill } from '@/components/StatusPill';
import { GlassTabBar } from '@/components/TabBar';
import { TabbedProvider, useBottomSpace } from '@/hooks/useBottomSpace';
import { SearchTransitionProvider } from '@/hooks/useSearchTransition';
import { palette } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { config } from '@/lib/config';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, idle: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? active : idle} size={size} color={color} />
  );
}

function ActivityPill() {
  const { user } = useAuth();
  const router = useRouter();
  const { floatBottom } = useBottomSpace();
  const enabled = user?.role === 'CUSTOMER';
  const { data } = useQuery(() => api.activity(), { enabled, pollMs: config.pollIntervalMs });
  if (!enabled || !data?.active) return null;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: floatBottom + 4 }} pointerEvents="box-none">
      <StatusPill active={data.active} onPress={() => router.push('/activity')} />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLocale();
  const { user } = useAuth();
  const role = user?.role;
  const isMerchant = role === 'MERCHANT';
  const isAdmin = role === 'ADMIN';
  const activityLabel = isMerchant ? t('merchant.manage') : isAdmin ? t('tabs.admin') : t('tabs.activity');
  // Customers discover; professionals run their shop; admins moderate.
  const hideDiscovery = isMerchant || isAdmin ? null : undefined;

  // Silky smooth white fade veil to mask any tab switching glitch
  const tabFade = useSharedValue(0);
  const fadeOverlayStyle = useAnimatedStyle(() => ({
    opacity: tabFade.value,
  }));

  const triggerTabFade = () => {
    tabFade.value = withSequence(
      withTiming(0.95, { duration: 75, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }),
    );
  };

  return (
    <TabbedProvider>
      <SearchTransitionProvider>
      <View style={{ flex: 1, backgroundColor: palette.white }}>
        <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          // Never carry an open keyboard from one tab to another.
          screenListeners={{
            blur: () => Keyboard.dismiss(),
            tabPress: () => {
              Keyboard.dismiss();
              triggerTabFade();
            },
          }}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: palette.white },
            // freezeOnBlur: false eliminates the Android react-native-screens frame tear
            freezeOnBlur: false,
            lazy: false,
            animation: 'fade',
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: isMerchant ? t('merchant.today') : t('tabs.home'),
              tabBarIcon: isMerchant ? icon('sunny', 'sunny-outline') : icon('home', 'home-outline'),
              href: isAdmin ? null : undefined,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{ title: t('tabs.explore'), tabBarIcon: icon('search', 'search-outline'), href: hideDiscovery }}
          />
          <Tabs.Screen
            name="map"
            options={{ title: t('tabs.map'), tabBarIcon: icon('map', 'map-outline'), href: hideDiscovery }}
          />
          <Tabs.Screen
            name="activity"
            options={{
              title: activityLabel,
              tabBarIcon: isMerchant ? icon('layers', 'layers-outline') : icon('pulse', 'pulse-outline'),
              lazy: false,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{ title: t('tabs.account'), tabBarIcon: icon('person-circle', 'person-circle-outline'), lazy: false }}
          />
        </Tabs>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.white, zIndex: 40 },
            fadeOverlayStyle,
          ]}
        />
        <ActivityPill />
      </View>
      </SearchTransitionProvider>
    </TabbedProvider>
  );
}
