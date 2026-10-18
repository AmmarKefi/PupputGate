import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';

/**
 * Compact brand/account controls; homepage can hide the wordmark to match the
 * photo-led reference header while retaining account affordances.
 */
export function HomeHeader({
  guest,
  tone = 'light',
  hideBrand = false,
}: {
  guest: boolean;
  tone?: 'light' | 'dark';
  hideBrand?: boolean;
}) {
  const router = useRouter();
  const { t, isRTL } = useLocale();
  const dark = tone === 'dark';
  const notificationQuery = useQuery(() => api.notifications(), { enabled: !guest });
  const unread = notificationQuery.data?.unread ?? 0;

  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {hideBrand ? <View /> : (
        <View style={[styles.brand, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.mark, dark ? styles.markDark : styles.markLight]}>
            <Ionicons name="compass" size={18} color={dark ? palette.white : palette.forest} />
          </View>
          <Text variant="bodyStrong" color={dark ? palette.white : palette.ink} style={{ marginStart: spacing.sm }}>
            {t('common.appName')}
          </Text>
        </View>
      )}

      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {!guest ? (
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="link"
            accessibilityLabel={unread > 0 ? `${t('account.notifications')} · ${unread}` : t('account.notifications')}
            hitSlop={8}
            style={[styles.notification, dark ? styles.notificationDark : styles.notificationLight]}
          >
            <Ionicons
              name="notifications-outline"
              size={19}
              color={dark ? palette.white : palette.forest}
            />
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text variant="meta" color={palette.white} style={styles.badgeText}>
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {guest ? (
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="link"
            accessibilityLabel={t('welcome.signIn')}
            hitSlop={8}
            style={[styles.notification, dark ? styles.notificationDark : styles.notificationLight]}
          >
            <Ionicons
              name="person-outline"
              size={19}
              color={dark ? palette.white : palette.forest}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'space-between' },
  brand: { alignItems: 'center' },
  mark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  markLight: { backgroundColor: palette.mint },
  markDark: { backgroundColor: 'rgba(255,255,255,0.16)' },
  actions: { alignItems: 'center', gap: spacing.md },
  notification: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationLight: { backgroundColor: palette.mint },
  notificationDark: { backgroundColor: 'rgba(255,255,255,0.14)' },
  badge: {
    position: 'absolute',
    top: -3,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4511E',
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  badgeText: { fontSize: 9, lineHeight: 11, fontWeight: '800' },
});
